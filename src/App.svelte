<script>
	import "bulma/css/bulma.css";

	import Period from "./Comps/period.svelte";
	import Depart from "./Comps/depart.svelte";

	import Drawer from "svelte-drawer-component";
	let open = false;

	export let name;
	let show = false;
</script>

<main>
	<h1 on:click={() => (open = true)}>Расписание {name}</h1>
	<!-- <Button>???</Button> -->

	<div>
		<Drawer {open} on:clickAway={() => (open = false)} size="40%">
			<Period />
			<Depart />
		</Drawer>
	</div>

	<p class="buttons">
		<button class="button">
			<span class="icon is-small">
				<i class="fas fa-bold" />
			</span>
		</button>
		<button class="button">
			<span class="icon is-small">
				<i class="fas fa-italic" />
			</span>
		</button>
		<button class="button">
			<span class="icon is-small">
				<i class="fas fa-underline" />
			</span>
		</button>
	</p>
	<button class="button is-large is-responsive"> Large </button>
	<p>
		Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn
		how to build Svelte apps.
	</p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		font-family: Roboto;
		font-weight: 600;

		/* font-size: 30px; */
		font-size: 1.1vw;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	main:global(.drawer .overlay) {
		background: rgba(100, 100, 100, 0.5);
	}

	main div :global(.drawer .panel) {
		/* background: black; */
		max-width: 500px !important;
		color: rgb(141, 128, 203);
	}
</style>
