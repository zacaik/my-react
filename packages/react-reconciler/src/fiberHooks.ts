import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatcher } from 'react/src/currentDispatcher';
import { Dispatch } from 'react';

// 当前正在渲染的 FC 对应的 FiberNode
let currentlyRenderingFiberNode: FiberNode | null = null;
// 当前正在处理的 Hook
let workInProgressHook: Hook | null = null;

const { currentDispatcher } = internals;

interface Hook {
	/**
	 * 对于 useState，memorizedState 保存对应的 state
	 */
	memorizedState: any;
	updateQueue: unknown;
	/**
	 * 指向下一个 Hook
	 */
	next: Hook | null;
}

/**
 * 获取函数组件的返回结果
 * @param wip 函数组件对应的 FiberNode
 */
export function renderWithHooks(wip: FiberNode) {
	currentlyRenderingFiberNode = wip;
	wip.memoizedState = null;

	const current = wip.alternate;

	if (current !== null) {
		// update
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type; // 函数本身
	const props = wip.pendingProps;
	const children = Component(props);
	currentlyRenderingFiberNode = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {}
