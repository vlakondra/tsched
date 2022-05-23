<script>
    import { fade } from "svelte/transition";
    export let sched;

    let shows = Array(sched.length).fill(true);

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
    let w;
</script>

<svelte:window bind:outerWidth={w} />

<h1>SHAHSCHED {w}</h1>

<div class="pair-wrapper">
    {#each sched as month, m}
        <div
            on:click={() => (shows[m] = !shows[m])}
            style="grid-column: 1 / 10;"
            class="month"
        >
            <span> {month.Month}</span>
            <span
                >{PairCount(month.DateDay)} пар; {month.DateDay.length} дней</span
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
                    style="grid-column: {startCol} / {startCol +
                        1};background-color:lightgreen"
                    in:fade={{ duration: 500 }}
                    out:fade
                    class="pair-ceil"
                >
                    <div>
                        {day.DatePair}
                    </div>
                    <div>
                        {day.DayWeek}
                    </div>
                </div>

                {#each Object.entries(timepairs) as [n_pair, time]}
                    <div
                        style="grid-column: {parseInt(n_pair) + 1} / {parseInt(
                            n_pair
                        ) + 2}"
                        in:fade={{ duration: 1000 }}
                        out:fade
                        class="pair-ceil"
                    >
                        {#if day.Schedule.findIndex((el) => el.TimeStart == time) == -1}
                            {""}
                        {:else}
                            <div
                                title={PairItem(day.Schedule, time).TimeStart}
                                style="display: flex;
                    flex-direction: column;
                    justify-content: center;
                    height: 100%;"
                                class="pair-detail"
                            >
                                <div class="subj">
                                    {PairItem(day.Schedule, time).SubjSN}
                                </div>
                                <div class="kind-aud">
                                    <div>
                                        {PairItem(day.Schedule, time)
                                            .LoadKindSN}
                                    </div>
                                    <div>
                                        {PairItem(day.Schedule, time).Aud}
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

<style>
    .pair-wrapper {
        display: grid;
        gap: 1px;
        background-color: rgb(190 185 210);
        grid-template-columns: repeat(8, auto);
        grid-template-rows: auto;
        border-top-left-radius: 0.7em;
        border-top-right-radius: 0.7em;
    }
    .timepairs {
        background-color: rgb(136, 120, 243);
        color: whitesmoke;
        padding: 0 5px;
    }
    .pair-ceil {
        font-weight: 300;
        /* background-color: rgb(215, 235, 250); */
        background-color: rgb(233 236 239);
        padding: 5px;
    }

    .pair-detail div {
        /* background-color: darkturquoise; */
        /* color: rgb(36 69 70); */
        padding: 0 3px;
    }

    .subj {
        background-color: bisque;
        color: rgb(45, 88, 88);
        border-top-left-radius: 0.5em;
        border-top-right-radius: 1px solid #bfa8a8;
        border-bottom: 1px solid #bfa8a8;
    }

    .kind-aud {
        /* border-radius: 0.5em; */
        background-color: bisque;
        color: rgb(45, 88, 88);
    }
    .groups {
        background-color: rgb(113, 171, 173);
        color: azure !important;
        /* font-size: 0.8em; */
        font-size: 0.7em;
        border-radius: 0.5em;
        word-break: break-all;
    }

    /* .pair-wrapper div {
        background-color: blue;
        font-weight: 300px !important;
    } */
</style>
