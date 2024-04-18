import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode } from './fiber';

// 指向当前正在工作的 fiberNode
let workInProgress: FiberNode | null = null;

function renderRoot(root: FiberNode) {
	workInProgress = root;
	try {
		workLoop();
	} catch (error) {
		console.log('work loop error', error);
		workInProgress = null;
	}
}

function workLoop() {
	while (workInProgress !== null) {
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
		} else {
			// 如果没有兄弟节点，就返回父节点继续遍历
			node = node.return;
			workInProgress = node;
		}
	}
}
