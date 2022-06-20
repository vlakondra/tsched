<script>
    import { time } from "./store.js";
    export let onBurgerClick;

    import Fa from "svelte-fa";
    import { faBars } from "@fortawesome/free-solid-svg-icons";

    // https://cweili.github.io/svelte-fa/
    //https://www.npmjs.com/package/svelte-fa
    //https://fontawesome.com/v5/icons/bars?s=solid

    const formatter = new Intl.DateTimeFormat("ru", {
        hour12: false,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });
</script>

<div id="header" class="header">
    <div class="date">
        {new Date().toLocaleDateString("ru-RU")}
    </div>
    <div style="display:flex;flex-wrap: nowrap;align-items:center">
        <div class="burger" on:click={onBurgerClick}>
            <Fa icon={faBars} />
        </div>
        <div class="caption">Расписание преподавателей</div>
    </div>
    <div class="time">{formatter.format($time)}</div>
</div>

<style>
    .header {
        display: flex;
        flex-direction: row;
        align-items: center;
        background-color: #bea5f5;
        flex-wrap: nowrap;
        align-content: center;
        justify-content: space-around;
        padding: 10px 0;
        margin-top: 10px;
        margin-bottom: 25px;
        box-shadow: 1px 2px 6px 0px #5a3c3c;
        border-radius: 5px;
    }
    .date,
    .time {
        color: #f9ffef; /*#6c8441;*/
        font-size: 1.15em;
        text-shadow: 1px 1px 1px rgb(75 50 31);
        letter-spacing: 0.5px;
    }

    .burger {
        width: 50px;
        text-align: center;
        color: #fff;
        cursor: pointer;
    }
    .caption {
        font-family: Roboto;
        text-shadow: 1px 1px 1px rgb(75 50 31);
        color: white;
        font-size: 2em;
        font-weight: 200;
    }
    @media (min-width: 500.5px) {
        .burger {
            /* margin-right: 1em; */
            font-size: 1.75em;
            /* color: wheat; */
        }
        .caption {
            font-size: 1.8em;
            letter-spacing: 1px;
            line-height: 1em;
        }
    }

    @media (max-width: 690px) {
        .date,
        .time {
            display: none;
        }
    }
    @media (max-width: 500px) {
        .header {
            padding: 5px 5px;
            /* line-height: 1.5em; */
        }
        .caption {
            font-size: 1.4em;
            font-weight: 100;
            line-height: 1em;
        }
        .burger {
            /* margin-right: 10px; */
            font-size: 1.5em;
        }
        .header {
            margin: 3px 0 0px 0;
        }
    }

    @media (max-width: 400px) {
        .header {
            padding: 5px !important;
        }
        .caption {
            font-size: 1.35em;
            line-height: 1em;
        }
    }
</style>
