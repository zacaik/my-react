import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import { HostComponent, HostRoot, HostText } from './workTag';
import { mountChildFibers, reconcileChildrenFibers } from './childFibers';

/**
 * React 会用 DFS 来处理组件树中的节点，beginWork 是 DFS 的递阶段
 */
export const beginWork = (wip: FiberNode) => {
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			// 文本类节点是叶子节点，返回 null，返回上级继续进行 DFS
			return null;
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现的 tag');
			}
			break;
	}
	return wip.child;
};

function updateHostRoot(wip: FiberNode) {
	// 获取更新前的状态
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	// 获取更新后的状态
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState; // hostRootFiber 更新后的 state 就是 hostRootFiber 的子节点对应的 ReactElement

	// 现在要把这个 ReactElement 转换成 FiberNode
	reconcileChildren(wip, nextChildren);

	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

/**
 * 根据当前 wip 节点的子节点的 ReactElement 生成当前 wip 节点的子节点，并打上 flags
 * @param wip 当前的 wip 节点
 * @param children 当前 wip 节点的子节点对应的 ReactElement
 */
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;

	if (current !== null) {
		// update
		wip.child = reconcileChildrenFibers(wip, current.child, children);
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children);
	}
}
