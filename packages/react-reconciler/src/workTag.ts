export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;

export const FunctionComponent = 0; // 函数组件
export const HostRoot = 3; // 宿主根节点
export const HostComponent = 5; // 宿主节点，在浏览器中代表 DOM 节点
export const HostText = 6; // 宿主节点的文本内容
