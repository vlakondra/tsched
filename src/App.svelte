<script>
	import "bulma/css/bulma.css";

	import Header from "./Comps/header.svelte";
	import StartMessage from "./Comps/startmessage.svelte";
	import Period from "./Comps/period.svelte";
	import Depart from "./Comps/depart.svelte";

	import Drawer from "svelte-drawer-component";
	let open = false;
	// let hopen;

	// export let name;
	// let show = false;
	let showIndicator = true; //Получены ли данные кафедр
	const oncheckDepartData = (res) => {
		//здесь нужны еще данные об ошибках
		if (res.hasOwnProperty("isdata")) showIndicator = false;
	};

	const TurnDrawer = () => {
		open = true;
	};
</script>

<main>
	<Header onBurgerClick={TurnDrawer} />

	<Drawer {open} on:clickAway={() => (open = false)} size="40%">
		<button on:click={() => (open = false)} class="delete is-medium" />
		<Period />
		<Depart checkDepartData={oncheckDepartData} />
	</Drawer>

	<StartMessage {showIndicator} openDrawer={TurnDrawer} />
</main>

<style>
	main {
		height: 100%;
		background-color: beige;
		position: relative;
	}

	button.delete.is-medium {
		left: 95%;
		top: 1px;
	}

	main:global(.drawer .overlay) {
		background: rgba(100, 100, 100, 0.5);
	}

	main :global(.drawer .panel) {
		/* background: black; */
		max-width: 500px !important;
		color: rgb(141, 128, 203);
	}
</style>
