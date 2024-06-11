import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTag';

// 指向当前正在工作的 fiberNode
let workInProgress: FiberNode | null = null;

/**
 * 执行协调
 * @param fiber 触发更新的 fiber 节点
 */
export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// react 的协调阶段总是从 fiberRootNode 开始的
	const root = markUpdateFromFiberToRoot(fiber);
	// TODO: 协调阶段具体怎么执行
	if (root) {
		renderRoot(root);
	}
}

function markUpdateFromFiberToRoot(fiber: FiberNode): FiberRootNode | null {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		// 返回 fiberRootNode
		return node.stateNode;
	}
	return null;
}

function prepareFreshStack(root: FiberRootNode) {
	// 创建双缓存树
	workInProgress = createWorkInProgress(root.current, {});
}

function renderRoot(root: FiberRootNode) {
	prepareFreshStack(root);

	try {
		workLoop();
	} catch (error) {
		if (__DEV__) {
			console.log('work loop error', error);
		}
		workInProgress = null;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		// 以当前 wip 节点开始进行 render
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber);

	if (next === null) {
		// 如果遍历到最后一个子节点, 开始往回遍历
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	while (node !== null) {
		completeWork(node);
		const sibling = node.sibling;

		if (sibling !== null) {
			// 如果有兄弟节点，继续遍历兄弟节点
			workInProgress = sibling;
			return;
		} else {
			// 如果没有兄弟节点，就返回父节点继续遍历
			node = node.return;
			workInProgress = node;
		}
	}
}
