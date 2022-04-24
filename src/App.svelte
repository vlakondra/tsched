<script>
	import "bulma/css/bulma.css";
	// import { Collapse } from "svelma";
	// import { Button } from "svelma";

	// import { Collapse } from "svelma";
	export let name;
	let show = false;
</script>

<main>
	<h1>Расписание {name}</h1>
	<!-- <Button>???</Button> -->

	<p>
		<a
			role="button"
			class="navbar-burger"
			aria-label="menu"
			aria-expanded="true"
			data-target="navbarBasicExample"
		>
			<span aria-hidden="true" />
			<span aria-hidden="true" />
			<span aria-hidden="true" />
		</a>
	</p>

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
</style>
