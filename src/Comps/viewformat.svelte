<script>
    import Switch from "svelte-switch";
    import Fa from "svelte-fa";
    import {
        faTableCells,
        faTableList,
    } from "@fortawesome/free-solid-svg-icons";

    let checkedValue = true;

    function handleChange(e) {
        const { checked } = e.detail;
        checkedValue = checked;
    }
    const changeFormat = () => {
        checkedValue = !checkedValue;
    };
</script>

<div class="switch-caption">Выберите формат:</div>
<div class="switch-wrapper">
    <div class="format-caption" on:click={changeFormat}>Таблица</div>
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
    <div class="format-caption" on:click={changeFormat}>Шахматка</div>
</div>
<br />
The switch is {checkedValue ? "on" : "off"}.

<style>
    :global(.react-switch-bg) {
        background-color: #3e8ed0 !important;
    }
    .switch-wrapper {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        width: 90%;
        /* margin: 0 auto; */
    }
    .switch-caption {
        width: 90%;
        margin: 20px auto 5px auto;
        letter-spacing: 1px;
        font-size: 1.05em;
    }
    .format-caption {
        cursor: pointer;
        text-decoration: underline;
    }
</style>
