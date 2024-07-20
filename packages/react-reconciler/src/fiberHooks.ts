import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatcher } from 'react/src/currentDispatcher';
import { Dispatch } from 'react/src/currentDispatcher';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

// 当前正在渲染的 FC 对应的 FiberNode
let currentlyRenderingFiber: FiberNode | null = null;
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
	currentlyRenderingFiber = wip;
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
	currentlyRenderingFiber = null;
	return children;
}

// mount 阶段的 hooks 集合
const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 获取到 Hook 对应的数据
	const hook = mountWorkInProgressHook();

	let memorizedState;

	if (initialState instanceof Function) {
		memorizedState = initialState();
	} else {
		memorizedState = initialState;
	}
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	hook.memorizedState = memorizedState;
	// @ts-ignore
	const dispatch = dispatchState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;
	return [memorizedState, dispatch];
}

function dispatchState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memorizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook === null) {
		// 第一个 Hook
		if (currentlyRenderingFiber === null) {
			throw new Error('Hooks only can use in Fc');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// 后续的 Hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
