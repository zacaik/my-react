import { Container, appendChildToContainer } from 'hostConfig';
import { FiberNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTag';

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

	// TODO: Update
	// TODO: ChildDeletion
};

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('commit Placement');
	}

	const hostParent = getHostParent(finishedWork);

	if (hostParent !== null) {
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
};

// 获取当前节点父节点的宿主节点
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

function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	// fiber host
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(hostParent, finishedWork.stateNode);
		return;
	}
	const child = finishedWork.child;
	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
