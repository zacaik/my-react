import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTag';
import { mountChildFibers, reconcileChildrenFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';

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
		case FunctionComponent:
			return updateFunctionComponent(wip);
		case Fragment:
			return updateFragment(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现的 tag');
			}
			break;
	}
	return wip.child;
};

function updateHostRoot(wip: FiberNode) {
	// 获取更新前的状态, mount 阶段即为 null
	const baseState = wip.memorizedState;
	// hostRootFiber 的 updateQueue 中含有的更新对象，其实对应的就是根组件的 ReactElement
	const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType>;
	// 更新对象，即 { action: ReactElement }
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	// 执行更新对象，获取更新后的状态
	const { memorizedState } = processUpdateQueue(baseState, pending);
	// memorizedState 就是根组件的 ReactElement
	wip.memorizedState = memorizedState;
	const nextChildren = wip.memorizedState;
	// 现在要把这个根组件对应的 ReactElement 转换成 FiberNode
	reconcileChildren(wip, nextChildren);

	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	// 对于 HostComponent 来讲，pendingProps 就是对应的 DOM 元素的子元素的 ReactElement 数组及其绑定的事件
	const nextProps = wip.pendingProps;
	// 获取子元素的 ReactElement 列表
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFunctionComponent(wip: FiberNode) {
	// 获取函数的执行结果，拿到函数组件返回的 ReactElement
	const nextChildren = renderWithHooks(wip);
	// 给函数组件返回的 ReactElement 创建 FiberNode
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
		// 如果 wip 是 HostRootFiber，mount 阶段也会进入到这个流程，mount 阶段，wip 的 alternate 就是当前的 HostRootFiber，肯定是不为 null 的
		// 因为要挂载首屏 DOM 树，所以会对根组件对应的 FiberNode 打上 Place 的标记
		wip.child = reconcileChildrenFibers(wip, current.child, children);
	} else {
		// mount
		// 非 HostRootFiber 的 FiberNode 在 mount 阶段，会进入到这个流程
		wip.child = mountChildFibers(wip, null, children);
	}
}

function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}
