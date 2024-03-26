import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import {
	ElementType,
	Key,
	Props,
	ReactElementType,
	Ref,
	Type
} from 'shared/ReactTypes';

/**
 * react element 的构造函数
 * @param type 元素类型
 * @param key 元素的 key
 * @param ref 元素的 ref
 * @param props 元素的属性
 * @returns 元素
 */
const ReactElement = (type: Type, key: any, ref: Ref, props: Props) => {
	const element: ReactElementType = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark: 'JR'
	};
	return element;
};

/**
 * 创建 react element
 * @param type 元素类型
 * @param config 元素属性
 * @param maybeChildren 子元素
 */
export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
	let key: Key = null;
	let ref: Ref = null;
	const props: Props = {};
	for (const prop in config) {
		if (Object.prototype.hasOwnProperty.call(config, prop)) {
			const val = config[prop];
			if (prop === 'key') {
				key = val;
				continue;
			}
			if (prop === 'ref') {
				ref = val;
				continue;
			}
			props[prop] = val;
		}
	}
	const childrenLength = maybeChildren.length;
	if (childrenLength) {
		if (childrenLength === 1) {
			props.children = maybeChildren[0];
		} else {
			props.children = maybeChildren;
		}
	}

	return ReactElement(type, key, ref, props);
};
