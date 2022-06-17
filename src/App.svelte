<script>
	import "bulma/css/bulma.css";
	import "@fontsource/roboto";

	import { fade } from "svelte/transition";
	import { scheddata } from "./Comps/store";

	import Header from "./Comps/header.svelte";
	import StartMessage from "./Comps/startmessage.svelte";
	import Period from "./Comps/period.svelte";
	import Depart from "./Comps/depart.svelte";

	import Schedule from "./Comps/schedule.svelte";
	import ShahSched from "./Comps/shahsched.svelte";

	import Progbar from "./Comps/progbar.svelte";

	import Drawer from "svelte-drawer-component";
	import ViewFormat from "./Comps/viewformat.svelte";

	import ResizeObserver from "svelte-resize-observer";

	let open = false;
	// let hopen;

	// export let name;
	// let show = false;
	// let showIndicator = {}; //true; //Получены ли данные кафедр

	// let checkData = { reqfinished: false, iserror: false };

	import Fa from "svelte-fa";
	import { faArrowCircleUp } from "@fortawesome/free-solid-svg-icons";

	const scrollToTop = () => {
		let dp = document.getElementById("0-month");
		if (dp) {
			dp.scrollIntoView({ block: "start", behavior: "smooth" });
		}
	};

	const TurnDrawer = () => {
		open = true;
	};
	let scrolly = 5;
	let w;
	let showtable = true;
</script>

<svelte:window bind:scrollY={scrolly} />

<svelte:head>
	<title>Расписание преподавателей</title>
</svelte:head>

<main class="container  is-widescreen" style="min-height: 100vh;">
	<!-- <ResizeObserver
		on:resize={(e) => {
			w = e.detail.clientWidth;
			console.log(e.detail.clientWidth, e);
		}}
	/> -->

	{#if scrolly > 100}
		<div transition:fade on:click={scrollToTop} class="totop-box">
			<h1>{scrolly}</h1>
			<Fa icon={faArrowCircleUp} color="wheat" size="2.5x" />
		</div>
	{/if}

	<Header onBurgerClick={TurnDrawer} />

	<Drawer {open} on:clickAway={() => (open = false)} size="null">
		<div class="notification">
			<button on:click={() => (open = false)} class="delete is-medium" />
			<Period />
			<Depart />
			<ViewFormat />
		</div>
	</Drawer>

	<Progbar />
	<StartMessage openDrawer={TurnDrawer} />

	<!-- {#if Object.keys($scheddata).length} -->
	{#if { showtable }}
		<Schedule />
	{:else}
		<ShahSched />
	{/if}
	<!-- {/if} -->
</main>

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
	/* ПРОВЕРИТЬ - НУжНО ЛИ? */
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

	main :global(.drawer .panel .notification) {
		padding-left: 5px;
		padding-right: 5px;
		height: 100%;
	}

	@media (min-width: 501px) {
		main :global(.drawer .panel) {
			transition: transform 1s ease;
			width: 70% !important;
			max-width: 350px !important;
			color: rgb(141, 128, 203);
		}
	}
	@media (max-width: 500px) {
		main :global(.drawer .panel) {
			max-width: 80% !important;
			font-size: 0.9rem;
			color: rgb(141, 128, 203);
		}

		main {
			margin-bottom: 5px;
		}
	}

	.totop-box {
		position: fixed;
		left: 80%;
		top: 80%;
		cursor: pointer;
		z-index: 99999;
	}
</style>
