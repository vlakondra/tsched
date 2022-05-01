<script>
    export let onBurgerClick;
</script>

<div class="container ">
    <div class="header">
        <div on:click={onBurgerClick} class="burger">
            <div class="burg-line" />
            <div class="burg-line" />
            <div class="burg-line" />
        </div>
        <div class="caption">Расписание преподавателей</div>
    </div>
</div>

<style>
    .header {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        background-color: burlywood;
        color: white;
        font-family: Roboto;
        font-size: 5vw;
        font-weight: 100;
    }
    .caption {
        margin-left: 10px;
        text-shadow: 2px 3px 4px black;
    }
    .burger {
        width: 60px;
        height: 60px;
        margin-right: 10px;
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
    @media (max-width: 960px) {
        .burger {
            width: 40px;
            height: 30px;
        }
    }

    /* @media (min-width: 640px) {
		main {
			max-width: none;
		}
	} */
</style>
