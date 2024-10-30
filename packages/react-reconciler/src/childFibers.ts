import { Key, Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProgress
} from './fiber';
import { Fragment, HostText } from './workTag';
import { ChildDeletion, Placement } from './fiberFlags';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbol';

type ExistingChildren = Map<string | number, FiberNode>;

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
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							// 对于 Fragment，直接处理其子元素
							props = element.props.children;
						}
						const existing = useFiber(currentFiber, props);
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
		let fiber;
		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, key);
		} else {
			fiber = createFiberFromElement(element);
		}
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

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFistChild: FiberNode | null,
		newChild: any[]
	) {
		// 最后一个可复用 fiber 的 index
		let lastPlacedIndex: number = 0;
		// 创建的最后一个 fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个 fiber
		let fistNewFiber: FiberNode | null = null;

		// 将 current 保存在 map 中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFistChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}
		for (let i = 0; i < newChild.length; i++) {
			// 遍历 newChild，判断旧节点是否可服用
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			if (newFiber === null) {
				// 如果 after 是 null 或者 false，newFiber 就是 null。不会为这种类型的值创建 fiberNode
				continue;
			}
			// 标记移动和插入
			newFiber.index = i;
			newFiber.return = returnFiber;
			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				fistNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = newFiber;
			}

			if (!shouldTrackEffect) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				// 复用的节点
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					// 如果更新前的索引小于当前最后一个可复用fiber的索引，说明这个 fiber 在更新后向右移动了，标记移动
					newFiber.flags |= Placement;
					continue;
				} else {
					// 否则，它更新前的索引大于更新后的索引，这个 fiber 不需要向右移动，
					lastPlacedIndex = oldIndex;
				}
			} else {
				// 新创建的节点, 标记插入
				newFiber.flags |= Placement;
			}
		}
		// 标记删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		return fistNewFiber;
	}

	// 寻找 newChild 中的可复用节点
	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		const keyToUse = element.key !== null ? element.key : index;
		const before = existingChildren.get(keyToUse) || null;
		if (typeof element === 'string' || typeof element === 'number') {
			// newChild 是 HostText
			if (before) {
				if (before.tag === HostText) {
					// type 一样，key 一样，可以复用旧节点
					// 将可以复用的旧节点从 map 中移除，因为 map 中剩下的节点会被打上删除的标记
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			// 如果没有找到对应 key 的节点，则没有可复用节点，创建新节点
			return new FiberNode(HostText, { content: element + '' }, null);
		}
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
			}
		}
		if (Array.isArray(element)) {
			return updateFragment(
				returnFiber,
				before,
				element,
				keyToUse,
				existingChildren
			);
		}
		return null;
	}

	return function reconcileChildrenFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 处理 Fragment
		// Fragment 作为组件根元素的情况
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;

		if (isUnkeyedTopLevelFragment) {
			// 这种情况，不用处理 Fragment，直接处理其 children
			newChild = newChild?.props.children;
		}

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
			if (Array.isArray(newChild)) {
				// 如果更新后，有多个子节点，则进入多节点 diff 算法流程
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (currentFiber) {
			// 兜底删除
			deleteRemainingChildren(returnFiber, currentFiber);
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

function updateFragment(
	returnFiber: FiberNode,
	current: FiberNode | null,
	elements: any[],
	key: Key,
	existingChildren: ExistingChildren
) {
	let fiber;
	if (!current || current.tag !== Fragment) {
		fiber = createFiberFromFragment(elements, key);
	} else {
		existingChildren.delete(key);
		fiber = useFiber(current, elements);
	}
	fiber.return = returnFiber;
	return fiber;
}

export const reconcileChildrenFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
