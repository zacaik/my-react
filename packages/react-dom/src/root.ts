import { Container } from 'hostConfig';
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { initEvent } from './syntheticEvent';

export function createRoot(container: Container) {
	// container 就是 React 应用挂载的 DOM 节点，document.getElementById('root')
	const root = createContainer(container);

	return {
		// element 就是根 React 组件即 App 函数组件对应的 ReactElement
		render(element: ReactElementType) {
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}
