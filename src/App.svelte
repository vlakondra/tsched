<script>
	//https://tsched.vercel.app/
	import "bulma/css/bulma.css";
	import "@fontsource/roboto";

	import { client_width, err_sched_data } from "./Comps/store.js";

	import { fade } from "svelte/transition";

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
	import Errschedule from "./Comps/errschedule.svelte";

	let open = false;

	import Fa from "svelte-fa";
	import { faArrowCircleUp } from "@fortawesome/free-solid-svg-icons";

	const scrollToTop = () => {
		let dp = document.getElementById("header");
		if (dp) {
			dp.scrollIntoView({
				block: "start",
				behavior: "smooth",
			});
		}
	};

	const TurnDrawer = () => {
		open = !open;
	};

	let showtable = true;
	const ToggleSwitch = (frm) => {
		showtable = frm;
	};

	let scrolly = 5;
	let w;
</script>

<svelte:window bind:scrollY={scrolly} />

<svelte:head>
	<title>Расписание преподавателей</title>
</svelte:head>

<main class="container  is-widescreen" style="min-height: 100vh;">
	<ResizeObserver
		on:resize={(e) => {
			w = e.detail.clientWidth;
			client_width.update(() => w);
		}}
	/>
	<!-- deepskyblue -->
	{#if scrolly > 100}
		<div transition:fade on:click={scrollToTop} class="totop-box">
			<Fa icon={faArrowCircleUp} color="#6565ed" size="2.5x" />
		</div>
	{/if}

	<Header onBurgerClick={TurnDrawer} />
	<Drawer {open} on:clickAway={() => (open = false)} size="null">
		<div class="notification">
			<button
				on:click={() => (open = false)}
				class="delete is-medium"
			/><Period /><Depart state_drawer={TurnDrawer} /><ViewFormat
				changeformat={ToggleSwitch}
			/>
		</div>
	</Drawer>
	<Progbar />
	<StartMessage openDrawer={TurnDrawer} />

	{#if $err_sched_data}
		<div>
			<Errschedule errmessage={$err_sched_data} />
		</div>
	{:else if showtable}
		<Schedule />
	{:else}
		<ShahSched />
	{/if}
</main>

<style>
	main {
		height: 100%;
		margin-bottom: 40px;
		padding: 5px;
		position: relative;
	}

	.container {
		max-width: 960px !important;
	}

	/* ПРОВЕРИТЬ - НУжНО ЛИ? */
	:global(.month) {
		cursor: pointer;
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
