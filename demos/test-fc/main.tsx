import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	return (
		<div>
			<Child />
		</div>
	);
}

function Child() {
	return <div>child123</div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
