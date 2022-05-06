<script>
    export let onBurgerClick;

    import Fa from "svelte-fa";
    import { faBars } from "@fortawesome/free-solid-svg-icons";

    // https://cweili.github.io/svelte-fa/
    //https://www.npmjs.com/package/svelte-fa
    //https://fontawesome.com/v5/icons/bars?s=solid
</script>

<div class="container ">
    <div class="header">
        <div on:click={onBurgerClick}>
            <!-- <i on:click={onBurgerClick} class="fas fa-bars" /> -->
            <Fa icon={faBars} color="white" size="2.5x" />
        </div>
        <!-- <div on:click={onBurgerClick} class="burger">
            <div class="burg-line" />
            <div class="burg-line" />
            <div class="burg-line" />
        </div> -->
        <div class="title caption">Расписание преподавателей</div>
    </div>
</div>

<style>
    .header {
        display: flex;
        flex-direction: row;
        align-items: center;
        background-color: burlywood;
        flex-wrap: nowrap;
        align-content: center;
        justify-content: space-evenly;
        padding: 10px 0;
    }
    .caption {
        /* margin-left: 10px; */
        text-shadow: 2px 3px 4px black;

        color: rgb(229, 229, 229) !important;
        font-family: inherit;
        font-size: 150%;
        font-weight: 300;
    }
    .burger {
        width: 60px;
        height: 60px;
        /* margin-right: 10px; */
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        cursor: pointer;
    }
    .burg-line {
        width: 100%;
        height: 4px;
        background-color: blue;
        border-radius: 4px;
    }
    @media screen and (max-width: 320px) {
        .burger {
            width: 25px;
            height: 25px;
        }
    }

    /* @media (min-width: 640px) {
		main {
			max-width: none;
		}
	} */
</style>
