import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	return <div>{num}</div>;
}

function Child() {
	return <div>child123</div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
