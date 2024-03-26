export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
	/**
	 * 表明该对象是一个 react element 的特殊属性
	 */
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	/**
	 * 该属性用于与原生的 react element 进行区分
	 */
	__mark: string;
}
