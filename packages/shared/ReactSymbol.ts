const supportSymbol = typeof Symbol === 'function' && Symbol.for;

// 用来标识 react element
export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;
