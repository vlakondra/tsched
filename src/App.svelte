<script>
	import "bulma/css/bulma.css";

	import Header from "./Comps/header.svelte";
	import LoadIndicator from "./Comps/loadindicator.svelte";
	import Period from "./Comps/period.svelte";
	import Depart from "./Comps/depart.svelte";

	import Drawer from "svelte-drawer-component";
	let open = false;
	// let hopen;

	// export let name;
	// let show = false;
	let isDepartData = false; //Получены ли данные кафедр
	const onGetDepartData = (res) => {
		//здесь нужны еще данные об ошибках
		if (res.data && !res.error) isDepartData = true;
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
		<Depart getDepartData={onGetDepartData} />
	</Drawer>

	<LoadIndicator isdata={isDepartData} />

	<div style="width:200px; height:200px">
		<div style="position:relative">
			<i
				class="fas fa-user-clock"
				style=" font-weight: 600; font-size: 200px; color: rgb(208 175 132 / 37%);"
			/>
		</div>
		<div style="position:relative;top: -58%;left: 50%;">999</div>
	</div>

	<div
		class="notification2 is-primary"
		style="  position:relative;top:40%;text-align:center;width:300px;margin:0 auto"
	>
		Расписание на апрель 2022 <br />
		cоставлено.<br />
		<i
			class="fas fa-user-clock"
			style="    font-weight: 600;
	font-size: 250px;
	color: rgb(208 175 132 / 37%);"
		/>
		<button on:click={() => (open = true)}>Выберите преподавателя</button>
	</div>

	<div>
		<span class="icon is-large">
			<span class="fa-stack fa-lg">
				<i
					class="fas fa-user-clock"
					style="    font-weight: 600;
				font-size: 250px;
				color: rgb(208 175 132 / 37%);"
				/>
			</span>
		</span>
	</div>
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
