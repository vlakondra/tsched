<script>
	import "bulma/css/bulma.css";

	import "@fontsource/roboto";

	import Header from "./Comps/header.svelte";
	import StartMessage from "./Comps/startmessage.svelte";
	import Period from "./Comps/period.svelte";
	import Depart from "./Comps/depart.svelte";
	import Schedule from "./Comps/schedule.svelte";

	import Drawer from "svelte-drawer-component";
	import ResizeObserver from "svelte-resize-observer";

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
	let scrolly;
	let w;
</script>

<!-- <svelte:window bind:outerWidth={x} /> -->

<svelte:head>
	<title>Расписание преподавателей</title>
</svelte:head>

<main class="container  is-widescreen">
	<ResizeObserver
		on:resize={(e) => {
			w = e.detail.clientWidth;
			console.log(e.detail.clientWidth, e);
		}}
	/>

	<Header onBurgerClick={TurnDrawer} />

	<Drawer {open} on:clickAway={() => (open = false)} size="null">
		<div class="notification">
			<button on:click={() => (open = false)} class="delete is-medium" />
			<Period />
			<Depart checkDepartData={oncheckDepartData} />
		</div>
	</Drawer>
	<!-- 
	<StartMessage {checkData} openDrawer={TurnDrawer} /> -->
	<Schedule {scrolly} />
	{w}
</main>

<svelte:window bind:scrollY={scrolly} />

<style>
	main {
		height: 100%;
		margin-bottom: 40px;
		padding: 5px;
		position: relative;
		font-family: Roboto;
	}
	.container {
		max-width: 960px !important;
	}
	:global(.month) {
		cursor: pointer;
		font-family: Roboto;
		/* border-top-left-radius: 0.7em;
		border-top-right-radius: 0.7em; */
		padding: 5px 7px;
		background-color: #e67f7f;
		color: #eef9f9;
		border-bottom: 1px solid rgb(195, 195, 251);
		font-style: oblique;
		letter-spacing: 2px;
		font-size: 1.1em;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-direction: row;
	}

	:global(.month span) {
		border-bottom: 1px solid rgb(194, 194, 253);
		font-style: oblique;
	}

	:global(.month:first-child) {
		border-top-left-radius: 0.7em;
		border-top-right-radius: 0.7em;
	}

	button.delete.is-medium {
		/* left: 93%; */
		right: 0;
		top: 1px;
	}

	main:global(.drawer .overlay) {
		background: rgba(100, 100, 100, 0.5);
	}

	@media (min-width: 501px) {
		main :global(.drawer .panel) {
			transition: transform 1s ease;
			/* для мобилы и компа сделать разные ширины */
			max-width: 60% !important;
			/* max-width: 90% !important; */
			color: rgb(141, 128, 203);
		}
	}
	@media (max-width: 500px) {
		main :global(.drawer .panel) {
			max-width: 80% !important;
		}
		main {
			margin-bottom: 5px;
		}
	}
</style>
