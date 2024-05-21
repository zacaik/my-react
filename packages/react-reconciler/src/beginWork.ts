import { FiberNode } from './fiber';

/**
 * React 会用 DFS 来处理组件树中的节点，beginWork 是 DFS 的递阶段
 */
export const beginWork = (fiber: FiberNode) => {
	return fiber.child;
};
