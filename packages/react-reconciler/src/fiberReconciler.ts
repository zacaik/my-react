import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { HostRoot } from './workTag';

/**
 * 在调用 createRoot 方法时调用该方法创建对应的 fiberRootNode
 * @param container 宿主根节点
 * @returns 创建好的 fiberRootNode
 */
export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);
	hostRootFiber.updateQueue = createUpdateQueue();
	return root;
}

/**
 * 在调用 createRoot(root).render(<App />) 时调用该方法进行更新
 * @param element 要更新或渲染的 reactElement
 * @param root 对应的 fiberRootNode
 */
export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	const update = createUpdate<ReactElementType | null>(element);
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);
	return element;
}
