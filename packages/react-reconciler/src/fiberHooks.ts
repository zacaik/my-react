import { FiberNode } from './fiber';

/**
 * 获取函数组件的返回结果
 * @param wip 函数组件对应的 FiberNode
 */
export function renderWithHooks(wip: FiberNode) {
	const Component = wip.type; // 函数本身
	const props = wip.pendingProps;
	const children = Component(props);
	return children;
}
