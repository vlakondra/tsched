import App from './App.svelte';

const app = new App({
	// target: document.body,
	target: document.querySelector('section div'),
});

export default app;