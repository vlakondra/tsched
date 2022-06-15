<script>
    export let onBurgerClick;

    import Fa from "svelte-fa";
    import { faBars } from "@fortawesome/free-solid-svg-icons";

    // https://cweili.github.io/svelte-fa/
    //https://www.npmjs.com/package/svelte-fa
    //https://fontawesome.com/v5/icons/bars?s=solid
</script>

<!-- <div class="container1"> -->
<div class="header">
    <div class="burger" on:click={onBurgerClick}>
        <Fa icon={faBars} />
    </div>
    <div class="caption">Расписание преподавателей</div>
</div>

<!-- </div> -->
<style>
    .header {
        display: flex;
        flex-direction: row;
        align-items: center;
        /* background-color: #6e8de4; */
        background-color: #bea5f5;
        flex-wrap: nowrap;
        align-content: center;
        justify-content: center;
        padding: 10px 0;
        margin-top: 15px;
        margin-bottom: 30px;
        box-shadow: 1px 2px 6px 0px #5a3c3c;
        border-radius: 5px;
    }
    .burger {
        margin-right: 0px;
        /* font-size: 2em; */
        color: #fff;
        cursor: pointer;
    }
    .caption {
        font-family: Roboto;
        text-shadow: 2px 3px 4px rgb(86, 246, 118);
        color: white;
        font-size: 2em;
        font-weight: 200;
    }
    @media (min-width: 500.5px) {
        .burger {
            margin-right: 1em;
            font-size: 1.5em;
            font-weight: 100;
        }
        .caption {
            font-size: 1.7em;
            font-weight: 100;
            letter-spacing: 1px;
        }
    }
    @media (max-width: 500px) {
        .header {
            padding: 5px 5px;
            /* line-height: 1.5em; */
        }
        .caption {
            font-size: 1.5em;
            font-weight: 100;
        }
        .burger {
            margin-right: 10px;
            font-size: 1.5em;
        }
        .header {
            margin: 3px 0 0px 0;
        }
    }

    @media (max-width: 400px) {
        .header {
            padding: 70px !important;
        }

        .caption {
            font-size: 1.35em;
        }
    }
</style>
