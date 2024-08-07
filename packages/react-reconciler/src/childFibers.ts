import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createFiberFromElement,
	createWorkInProgress
} from './fiber';
import { HostText } from './workTag';
import { ChildDeletion, Placement } from './fiberFlags';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';

/**
 * 子节点协调器，根据子节点的 ReactElement 创建对应的 FiberNode，并打上 flags
 * @param shouldTrackEffect 是否跟踪副作用。mount 场景下，只对 hostRootFiber 的子节点打上 flags，这样只会执行一次 DOM 插入操作，优化性能。
 */
function ChildReconciler(shouldTrackEffect: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffect) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	// diff 算法中删除剩余的子节点
	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstFiber: FiberNode | null
	) {
		if (!shouldTrackEffect) {
			return;
		}
		let childToDelete = currentFirstFiber;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		while (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				// key 相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					// 是 react element
					if (currentFiber.type === element.type) {
						// type 相同,复用旧节点
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						// 剩余的兄弟节点可以标记为删除
						deleteRemainingChildren(returnFiber, existing.sibling);
						return existing;
					}
					// key 相同，type 不同，删除所有的旧节点
					deleteRemainingChildren(returnFiber, currentFiber);
					break;
				} else {
					// 不是 ReactElement 的情况
					if (__DEV__) {
						console.warn('unexpected react element type', element.$$typeof);
						break;
					}
				}
			} else {
				// key 不同,删掉当前节点，继续遍历兄弟节点
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		while (currentFiber !== null) {
			if (currentFiber.tag === HostText) {
				// 类型没变，仍然是文字
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}
			// 类型变了，删除旧节点
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffect && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildrenFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('未支持的 ReactElementType', newChild);
					}
					break;
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (currentFiber) {
			// 兜底删除
			deleteChild(returnFiber, currentFiber);
		}

		// TODO: 多节点场景的实现
		if (__DEV__) {
			console.warn('暂未实现的 reconcile 类型', newChild);
		}

		return null;
	};
}

// fiberNode 的复用
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	// 对于同一个 fiberNode，它的复用指的是使用它在双缓存树中对应的节点
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildrenFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
