import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	// return num === 3 ? <Child /> : <div>{num}</div>;

	const arr =
		num % 2 === 0
			? [<li key={1}>1</li>, <li key={2}>2</li>, <li key={3}>3</li>]
			: [<li key={2}>2</li>, <li key={1}>1</li>, <li key={3}>3</li>];

	console.log(num);

	return (
		<div
			onClick={() => {
				setNum(num + 1);
			}}
		>
			<>
				<div>222</div>
				<div>123</div>
			</>
			<div>hahaha</div>
			{arr}
		</div>
	);

	return (
		<ul
			onClick={() => {
				setNum(num + 1);
			}}
		>
			{arr}
		</ul>
	);
}

function Child() {
	return <div>child123</div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
