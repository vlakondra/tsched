<script>
    import Switch from "svelte-switch";
    import { client_width } from "./store.js";
    import Fa from "svelte-fa";
    import {
        faTableCells,
        faTableList,
    } from "@fortawesome/free-solid-svg-icons";

    export let changeformat;

    let checkedValue = true;

    function handleChange(e) {
        const { checked } = e.detail;
        checkedValue = checked;

        changeformat(checkedValue);
    }
    const toggleFormat = (frm) => {
        if (frm == "tabl") checkedValue = true;
        else checkedValue = false;

        changeformat(checkedValue);
    };

    //автом-ки ставим таблицу при малой ширине
    client_width.subscribe((width) => {
        if (width < 500) {
            checkedValue = true;
            changeformat(checkedValue);
        }
    });
</script>

{#if $client_width > 500}
    <div class="switch-caption">Формат:</div>
    <div class="switch-wrapper">
        <div
            class="format-caption {checkedValue ? 'format-active' : ''}"
            on:click={() => toggleFormat("tabl")}
        >
            Таблица
        </div>
        <div>
            <Switch on:change={handleChange} checked={checkedValue} width="80">
                <svg
                    viewBox="0 0 10 10"
                    height="100%"
                    width="100%"
                    fill="aqua"
                    slot="checkedIcon"
                >
                    <Fa icon={faTableList} color="wheat" size="1x" />
                </svg>

                <svg
                    viewBox="0 0 10 10"
                    height="100%"
                    width="100%"
                    fill="blue"
                    slot="unCheckedIcon"
                >
                    <Fa icon={faTableCells} color="wheat" size="1x" />
                </svg>
            </Switch>
        </div>
        <div
            class="format-caption  {!checkedValue ? 'format-active' : ''}"
            on:click={() => toggleFormat("shah")}
        >
            Шахматка
        </div>
    </div>
    <br />
{/if}

<!--  {checkedValue ? "on" : "off"}. -->
<style>
    :global(.react-switch-bg) {
        background-color: #3e8ed0 !important;
    }
    .switch-wrapper {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        width: 90%;
    }
    .switch-caption {
        width: 90%;
        margin: 35px auto 0 auto;
        font-size: 1.05em;
    }
    .format-caption {
        cursor: pointer;
        text-decoration: underline;

        padding: 3px 5px;
        border-radius: 5px;
    }
    .format-active {
        background-color: #8bb68d;
        color: white;
    }
</style>
