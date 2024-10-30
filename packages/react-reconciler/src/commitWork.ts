import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTag';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		const child: FiberNode | null = nextEffect.child;

		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			nextEffect.child
		) {
			// 如果当前节点子树有副作用
			nextEffect = child;
		} else {
			// 如果当前子树没有副作用，或者当前子树不存在
			up: while (nextEffect !== null) {
				// 判断当前节点是否有副作用，如果有，则处理副作用
				commitMutationEffectOnFiber(nextEffect);
				// 继续遍历兄弟节点
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				// 继续遍历父节点
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;
	if ((flags & Placement) !== NoFlags) {
		// 如果有 Placement 标记
		commitPlacement(finishedWork);
		// 去掉 Placement 标记
		finishedWork.flags &= ~Placement;
	}

	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}

	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete);
			});
		}
		finishedWork.flags &= ~ChildDeletion;
	}
};

/**
 * 找到所有要删除的 DOM 子树根节点
 * @param childrenToDelete 要删除的 DOM 子树根节点列表
 * @param unmountFiber 当前找到的要删除的 DOM 子树根节点
 */
function recordHostChildrenToDelete(
	childrenToDelete: FiberNode[],
	unmountFiber: FiberNode
) {
	const lastOne = childrenToDelete[childrenToDelete.length - 1];
	if (!lastOne) {
		childrenToDelete.push(unmountFiber);
	} else {
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountFiber === node) {
				// 只有当 unmountFiber 是最后一个要删除节点的兄弟节点时，才需要真正删除
				// 如果目标节点是 Fragment，则需要删除所有的子节点
				// 反之，只需要删除目标节点下的第一个有对应DOM元素的子节点
				childrenToDelete.push(unmountFiber);
			}
			node = node.sibling;
		}
	}
}

function commitDeletion(childToDelete: FiberNode) {
	// 需要删除的 DOM 子树根节点，因为存在 fragment，所以是一个数组，可能需要删除多个子树根节点
	const rootChildrenToDelete: FiberNode[] = [];
	// 根宿主节点
	// let rootHostNode: FiberNode | null = null;
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				// TODO 解绑 ref
				return;
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				return;
			case FunctionComponent:
				// TODO Effect unmount
				return;
			default:
				if (__DEV__) {
					console.warn('unexpected commit update deletion');
				}
				return;
		}
	});
	if (rootChildrenToDelete.length !== 0) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode, hostParent);
			});
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

/**
 * 找到当前要删除的 FiberNode 所有最近的有对应 DOM 元素的子 FiberNode
 * @param root 要删除的 FiberNode
 * @param onCommitUnmount 回掉函数，将找到的子 FiberNode 保存到列表中，并过滤掉非最近的子 FiberNode
 */
function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	// 深度优先遍历
	while (true) {
		onCommitUnmount(node);
		if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === root) {
			// node 没有 child，结束循环
			return;
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('commit Placement', finishedWork);
	}

	const hostParent = getHostParent(finishedWork);

	const sibling = getHostSibling(finishedWork);

	if (hostParent !== null) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}
};

/**
 * 获取目标 fiberNode 兄弟 fiberNode 的 hostNode
 * 如果兄弟 fiberNode 没有直接的对应的宿主节点，则继续向下，访问 child
 */
function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;
	findSibling: while (true) {
		// 如果目标 fiberNode 没有兄弟 fiberNode，则向上查找，访问父级 fiberNode（非 HostComponent、HostRoot）
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				// 找到最顶端都没找到，说明父级也没有兄弟节点
				return null;
			}
		}
		node.sibling.return = node.return;
		node = node.sibling;
		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 向下遍历
			if ((node.flags & Placement) !== NoFlags) {
				// 如果当前 sibling 也被打上了 Placement 的标记，证明它也在移动，不应该作为插入的依据
				// 继续遍历 sibling
				continue findSibling;
			}
			if (node.child === null) {
				// 如果当前 sibling 没有子节点，则继续遍历 sibling
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			// 找到的第一个 tag 是 HostText 或者 HostComponent，并且稳定的兄弟 hostNode
			return node.stateNode;
		}
	}
}

// 获取当前 fiberNode 最近的有宿主节点的父节点的宿主节点
function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;

	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return parent.stateNode.container as Container;
		}
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('host parent not found');
	}
	return null;
}

/**
 * 将目标 fiberNode 下的所有 hostNode 插入到目标宿主节点下
 * @param finishedWork 目标 fiberNode
 * @param hostParent 目标宿主节点
 */
function insertOrAppendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	// fiber host
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			/**
			 * 更新阶段，DOM 结构是已有的，insertBefore 操作其实就是把目标 DOM 移动到 DOM before 前
			 */
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
	}
	const child = finishedWork.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
