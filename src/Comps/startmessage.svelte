<script>
    import { fade } from "svelte/transition";
    export let checkData = { reqfinished: false, iserror: false }; //showIndicator;
    export let openDrawer;

    let date = new Date();
    let date_opts = { year: "numeric", month: "long" };
</script>

<!-- {#if showIndicator} -->
{#if !checkData.reqfinished}
    <span class="icon is-large load-indicator">
        <span class="fa-stack fa-lg">
            <i transition:fade class="fas fa-spinner fa-pulse " />
        </span>
    </span>
{:else if !checkData.iserror}
    <i transition:fade class="fas fa-user-clock sched-image" />

    <div transition:fade class="start-message">
        <p class="start-info">
            Составлено расписание<br /> на {date.toLocaleDateString(
                "ru-RU",
                date_opts
            )}

            <br />
            <button class="button select-tchr" on:click={openDrawer}>
                Выберите преподавателя
            </button>
        </p>
    </div>
{:else}
    <div class="start-message start-err">Произошла ошибка</div>
{/if}

<style>
    .load-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: blue;
        font-size: 5.5vw;
    }

    .sched-image {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin-top: 20px;
        font-size: 30vw;
        color: rgb(208 175 132 / 10%);
        resize: vertical;
    }

    .start-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin-top: 20px;
    }
    .start-info {
        text-align: center;
        font-size: 5vw;
        font-weight: 100;
        color: rgb(188 143 143 / 52%);
    }

    .start-err {
        text-align: center;
        font-size: 5vw;
        font-weight: 400;
        color: red;
    }

    .select-tchr {
        color: rgb(0 0 255 / 63%);
        background-color: transparent;
        font-size: 2.5vw;
        font-weight: 200;
    }
</style>
