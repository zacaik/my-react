/**
 * 实现 React 的 update 机制
 * ReactDOM.createRoot().render setState 等 API 将接入这个 update 机制
 */

import { Action } from 'shared/ReactTypes';

// 用于描述一次组件的更新
export interface Update<State> {
	action: Action<State>;
}

// 用于描述一系列更新
export interface UpdateQueue<State> {
	shared: {
		// 将要更新的状态
		pending: Update<State> | null;
	};
}

export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
	};
};

export const createUpdateQueue = () => {
	return {
		shared: {
			pending: null
		}
	};
};

export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	updateQueue.shared.pending = update;
};

export const processUpdateQueue = <State>(
	baseState: State,
	pendingState: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};

	if (pendingState !== null) {
		const action = pendingState.action;
		if (action instanceof Function) {
			result.memoizedState = action(baseState);
		} else {
			result.memoizedState = action;
		}
	}

	return result;
};
