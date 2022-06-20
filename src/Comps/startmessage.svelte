<script>
    import { load_ini_data, err_ini_data, sched_data_loaded } from "./store";
    import { fade } from "svelte/transition";
    import Fa from "svelte-fa";
    import { faSpinner } from "@fortawesome/free-solid-svg-icons";

    export let openDrawer;

    let date = new Date();
    let date_opts = { year: "numeric", month: "long" };
</script>

{#if !$sched_data_loaded}
    <div class="start-message">
        {#if $load_ini_data}
            <Fa icon={faSpinner} size="3x" spin color="blue" />
        {:else if $err_ini_data}
            <div>
                <p>Произошла ошибка</p>
                <p>
                    {$err_ini_data}
                </p>
            </div>
        {:else}
            <div transition:fade class="start-info">
                <div>Расписание</div>
                <div>
                    на {date.toLocaleDateString("ru-RU", date_opts)}
                </div>

                <button class="button select-tchr" on:click={openDrawer}>
                    Выберите преподавателя
                </button>
            </div>
        {/if}
    </div>
{/if}

<style>
    .start-message {
        /* font-family: sans-serif;
        font-weight: 400; */

        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin-top: 20px;
    }
    .start-info {
        display: flex;
        flex-direction: column;
        text-align: center;
        font-size: 2em;
        font-weight: 100;
        color: rgb(188 143 143 / 52%);
    }

    .select-tchr {
        color: rgb(0 0 255 / 63%);
        background-color: transparent;
        font-size: 0.75em;
        font-weight: 200;
    }
</style>
