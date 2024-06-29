import { Container, appendInitialChild, createInstance } from 'hostConfig';
import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTag';
import { NoFlags } from './fiberFlags';

/**
 * 递归处理 FiberNode 的归阶段
 * 1. 根据 fiber 树创建 DOM 树
 * 2. 标记 Update flag
 */
export const completeWork = (wip: FiberNode) => {
	const current = wip.alternate;
	const newProps = wip.pendingProps;
	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// TODO: update
			} else {
				// mount
				const instance = createInstance(wip.type, newProps);
				// wip.stateNode = instance
				appendAllChildren(instance, wip);
			}
			/**
			 * 在 completeWork 阶段，react 会将子树中的 flag 冒泡到当前节点
			 * 这样在后续的 commit 阶段，如果当前节点的 flags 是 NoFlag,就说明以这个节点为根节点的整个子树都没有变化，不用再继续递归处理了
			 */
			bubbleProperties(wip);
			return null;
		case HostText:
			return null;
		case HostRoot:
			return null;
		default:
			if (__DEV__) {
				console.warn('暂不支持的 tag of completeWork');
			}
			break;
	}
};

/**
 * 将当前 wip 下的所有子 DOM 节点插入到 wip 对应的 DOM 节点下
 * 考虑如下复杂的情况, 目前正在处理 div，需要将 div 下的所有子 DOM 节点都插入到 div 下
 * <div>
 *  <Bar/>
 *  <Foo/>
 *  <span>123</span>
 *  <span>666</span>
 * </div>
 * @param parent 当前 wip 对应的 DOM 节点
 * @param wip 当前 wip
 */
function appendAllChildren(parent: Container, wip: FiberNode) {
	let node = wip.child;

	/**
	 * 只有 tag 为 HostComponent 或者 HostText 的 fiber 才有对应的 DOM 节点可以直接插入
	 * 如果 tag 是 FunctionComponent, 则需要继续向下寻找，直到找到 HostComponent 或者 HostText 的 fiber
	 */
	while (node !== null) {
		// 先往下递，找到第一个 HostComponent 或者 HostText 的 fiber 为止
		if (node.tag === HostText || node.tag === HostComponent) {
			appendInitialChild(parent, node.stateNode);
		} else if (node.child !== null) {
			// node.child.return = node;
			node = node.child;
			continue;
		}

		// 然后再往回归，继续处理兄弟节点
		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}
			node = node.return;
		}
		node = node.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}
