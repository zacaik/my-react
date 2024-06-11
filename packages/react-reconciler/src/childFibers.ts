import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement } from './fiber';
import { HostText } from './workTag';
import { Placement } from './fiberFlags';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';

/**
 * 子节点协调器，根据子节点的 ReactElement 创建对应的 FiberNode，并打上 flags
 * @param shouldTrackEffect 是否跟踪副作用。mount 场景下，只对 hostRootFiber 的子节点打上 flags，这样只会执行一次 DOM 插入操作，优化性能。
 */
function ChildReconciler(shouldTrackEffect: boolean) {
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
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

		// TODO: 多节点场景的实现
		if (__DEV__) {
			console.warn('暂未实现的 reconcile 类型', newChild);
		}

		return null;
	};
}

export const reconcileChildrenFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
