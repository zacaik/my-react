import { Key, Props, Ref } from 'shared/ReactTypes';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
import { WorkTag } from './workTag';

export class FiberNode {
	/**
	 * 用来标记不同类型的 fiber 节点
	 * 比如 0 代表这个 fiber 节点对应的是一个 FunctionComponent
	 * 对于 hostRootFiber，它的 workTag 就是 HostRoot，3
	 */
	tag: WorkTag;
	/**
	 * 更细粒度的 fiber 节点的类型
	 * 对于 FunctionComponent, type 是函数本身
	 * 对于 HostComponent, type 是标签名
	 * 对于 hostRootFiber, type 的值是 "root"
	 */
	type: any;
	/**
	 * 待处理的 props，即 jsx 函数的 props 参数
	 */
	pendingProps: Props;
	/**
	 * ReactElement 的 key 值
	 */
	key: Key;
	/**
	 * 对于 HostComponent 类型的 fiber 节点, 值为对应的 DOM 对象
	 * 对于 FunctionComponent 类型的 fiber 节点，值为对应的组件实例
	 */
	stateNode: any;
	/**
	 * ReactElement 的 ref 值
	 */
	ref: Ref;
	/**
	 * 指向父节点
	 */
	return: FiberNode | null;
	/**
	 * 指向兄弟节点
	 */
	sibling: FiberNode | null;
	/**
	 * 指向子节点
	 */
	child: FiberNode | null;
	/**
	 * 当前节点在父节点的子节点列表中的索引位置
	 * 通过 index 属性，React 可以在协调和渲染过程中确定节点的相对位置和顺序。它有助于确定节点的插入、移动和删除操作。
	 */
	index: number;
	/**
	 * 组件更新后，对应的 ReactElement 的 props 的值，用于比较新旧 props
	 */
	memoizedProps: Props | null;
	/**
	 * 表示当前节点的替代节点，如果当前节点是 current 节点，则指向 WIP 节点，如果当前节点是 WIP 节点，则指向 current 节点
	 * 用于实现双缓存替换
	 */
	alternate: FiberNode | null;
	/**
	 * 表示当前节点的状态和对应的操作，比如更新、插入或删除
	 */
	flags: Flags;
	/**
	 * 当前 fiberNode 的更新队列
	 */
	updateQueue: unknown;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag;
		this.key = key;
		this.stateNode = null;
		this.type = null;
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;
		this.ref = null;
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.alternate = null;
		this.flags = NoFlags;
	}
}

export class FiberRootNode {
	/**
	 * 指向当前应用程序在宿主环境的根元素
	 * 在浏览器中，指向根 DOM 元素
	 */
	container: Container;
	/**
	 * 指向应用程序根节点所对应的 fiberNode，被称作 hostRootFiber
	 */
	current: FiberNode;
	/**
	 * 指向最近一次完成递归更新操作的 hostRootFiber
	 */
	finishedWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		this.finishedWork = null;
		hostRootFiber.stateNode = this;
	}
}
