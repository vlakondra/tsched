<script>
    //https://www.appypie.com/design/image-color-picker/
    import { scheddata, sched_data_loaded } from "./store";

    import { fade } from "svelte/transition";
    import { isToday, toEnDate } from "./util";

    let shows = Array($scheddata.length).fill(true);

    let timepairs = {
        1: "08:30",
        2: "10:15",
        3: "12:00",
        4: "14:05",
        5: "15:50",
        6: "17:35",
        7: "19:15",
        8: "20:55",
    };

    const PairCount = (daysArr) => {
        //считает кол-во пар в мес.
        let pcount = 0;
        daysArr.forEach((day) => {
            pcount += day["Schedule"].length;
        });
        return pcount;
    };

    let startCol = 1;

    const PairItem = (sch, ptime) => {
        return sch.find((e) => e.TimeStart == ptime);
    };
</script>

{#if Object.keys($scheddata).length}
    <div class="pair-wrapper">
        {#each $scheddata as month, m}
            <div
                on:click={() => (shows[m] = !shows[m])}
                style="grid-column: 1 / 10;"
                class="month"
            >
                <span> {month.Month}</span>
                <span
                    >Всего пар: {PairCount(month.DateDay)}; дней: {month.DateDay
                        .length}</span
                >
            </div>

            {#if shows[m]}
                <div style="grid-column: 1 / 2}; " class="timepairs" />

                {#each Object.entries(timepairs) as [n_pair, time], n}
                    <div
                        style="grid-column: {parseInt(n_pair) + 1} / {parseInt(
                            n_pair
                        ) + 2};"
                        class="timepairs"
                    >
                        {time}
                    </div>
                {/each}

                {#each month.DateDay as day, d}
                    <div
                        id={toEnDate(day.DatePair)}
                        style="grid-column: {startCol} / {startCol + 1};"
                        in:fade={{ duration: 500 }}
                        out:fade
                        class="first-ceil {day.DayWeek == 'Суббота'
                            ? 'sbt'
                            : 'date-pair'}   {isToday(day.DatePair)
                            ? 'today'
                            : ''}"
                    >
                        {#if isToday(day.DatePair)}
                            <div class="today-lbl">Сегодня</div>
                        {/if}

                        <div>
                            {day.DatePair}
                        </div>
                        <div>
                            {day.DayWeek}
                        </div>
                    </div>

                    {#each Object.entries(timepairs) as [n_pair, time]}
                        <div
                            style="grid-column: {parseInt(n_pair) +
                                1} / {parseInt(n_pair) + 2}"
                            in:fade={{ duration: 1000 }}
                            out:fade
                            class="pair-ceil"
                        >
                            {#if day.Schedule.findIndex((el) => el.TimeStart == time) == -1}
                                {""}
                            {:else}
                                <div
                                    title={PairItem(day.Schedule, time)
                                        .TimeStart}
                                    class="pair-detail"
                                >
                                    <div class="subj">
                                        {PairItem(day.Schedule, time).SubjSN}
                                    </div>

                                    <div class="aud-wrapper">
                                        <div class="aud">
                                            {PairItem(day.Schedule, time).Aud}
                                        </div>
                                        <div class="kind-load">
                                            {PairItem(day.Schedule, time)
                                                .LoadKindSN}
                                        </div>
                                    </div>

                                    <div class="groups">
                                        {PairItem(day.Schedule, time).GSName}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                {/each}
            {/if}
        {/each}
    </div>
{/if}

<style>
    .sbt {
        background-color: rgb(246 95 95) !important;
        color: whitesmoke;
        text-align: center;
    }
    .today {
        font-size: 1.15em;
        /* color: blue; */
        background-color: #97cfd0 !important;
    }
    .today-lbl {
        color: #fff;
        font-weight: 600;
        letter-spacing: 1px;
    }

    .month span:first-child {
        margin-left: 20px;
    }
    .date-pair {
        background-color: #7bdc7f;
        text-align: center;
    }
    .pair-wrapper {
        display: grid;
        gap: 0.8px;
        min-width: 860px;
        background-color: #8b8cab;
        grid-template-columns: repeat(8, auto);
        grid-template-rows: auto;
        border-top-left-radius: 0.7em;
        border-top-right-radius: 0.7em;
    }
    .timepairs {
        background-color: #7bdc7f;
        color: #225353;
        padding: 0 5px;
    }
    .first-ceil {
        padding: 5px 3px;
    }
    .pair-ceil {
        /* font-weight: 300; */
        /* background-color: rgb(215, 235, 250); */
        /* background-color: #7BDC7F; */
        background-color: #f1fff7;
        padding: 5px;
    }

    .pair-detail {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
    }
    .aud-wrapper {
        margin: 0;
        height: 40px;
    }
    .aud {
        text-align: right;
        font-size: 0.9em;
        font-weight: 400;
    }
    .subj {
        font-family: "Roboto";
        font-weight: normal;
        color: rgb(5 19 19);
        font-size: 0.95em;
        line-height: 1.1em;
        height: 36px;
        /* text-shadow: 0px 0.5px 0.5px #6f7df3; */
        /* Сделать media-query  для height
        border-top-left-radius: 0.5em; */
        /* border-top-right-radius: 1px solid #bfa8a8; */
        /* border-bottom: 1px solid #bfa8a8; */
    }
    .kind-load {
        text-align: right;
        line-height: 1em;
        font-size: 0.8em;
        font-weight: 400;
    }
    .groups {
        background-color: #d2c0fa;
        color: #071919 !important;
        font-size: 0.75em;
        border-radius: 0.4em;
        word-break: break-all;
        padding: 0 5px;
        min-height: 37px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
</style>
