<script>
	import "bulma/css/bulma.css";

	import Header from "./Comps/header.svelte";
	import StartMessage from "./Comps/startmessage.svelte";
	import Period from "./Comps/period.svelte";
	import Depart from "./Comps/depart.svelte";
	import Schedule from "./Comps/schedule.svelte";

	import Drawer from "svelte-drawer-component";
	let open = false;
	// let hopen;

	// export let name;
	// let show = false;
	// let showIndicator = {}; //true; //Получены ли данные кафедр
	let checkData = { reqfinished: false, iserror: false };
	const oncheckDepartData = (res) => {
		//здесь нужны еще данные об ошибках
		//showStartMessage = res
		//if (res.hasOwnProperty("isdata")) showIndicator = res; //false;

		checkData.reqfinished = res.reqfinished;
		checkData.iserror = res.iserror;
	};

	const TurnDrawer = () => {
		open = true;
	};
	let x;
</script>

<svelte:window bind:outerWidth={x} />
<main>
	<Header onBurgerClick={TurnDrawer} />
	{x}

	<Drawer {open} on:clickAway={() => (open = false)} size="null">
		<div class="notification">
			<button on:click={() => (open = false)} class="delete is-medium" />
			<Period />
			<Depart checkDepartData={oncheckDepartData} />
		</div>
	</Drawer>
	<!-- 
	<StartMessage {checkData} openDrawer={TurnDrawer} /> -->
	<Schedule />
</main>

<style>
	main {
		height: 100%;
		background-color: beige;
		position: relative;
		font-family: Roboto;
	}

	button.delete.is-medium {
		/* left: 93%; */
		right: 0;
		top: 1px;
	}

	main:global(.drawer .overlay) {
		background: rgba(100, 100, 100, 0.5);
	}

	main :global(.drawer .panel) {
		/* background: black; */
		transition: transform 2s ease;
		max-width: 80% !important;
		/* max-width: 90% !important; */
		color: rgb(141, 128, 203);
	}
</style>
