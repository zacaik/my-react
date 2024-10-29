const supportSymbol = typeof Symbol === 'function' && Symbol.for;

// 用来标识 react element
export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;

// 用来标识 react Fragment
export const REACT_FRAGMENT_TYPE = supportSymbol
	? Symbol.for('react.fragment')
	: 0xeacb;
