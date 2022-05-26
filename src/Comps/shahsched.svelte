<script>
    import { fade } from "svelte/transition";
    import { format } from "date-fns";

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

    const formatDate = (rudate) => {
        let frm = "yyyy-MM-dd";
        let spld = rudate.split(".");
        let d = new Date(
            parseInt(spld[2]),
            parseInt(spld[1]) - 1,
            parseInt(spld[0])
        );
        return format(d, frm); //  d.toISOString().slice(0, 10);
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

<div
    class="pair-wrapper"
    style="min-width:960px;  max-width:1200px;margin: 0 auto"
>
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
                        1};background-color:#8878f3; color:azure;font-weight:300"
                    in:fade={{ duration: 500 }}
                    out:fade
                    class="pair-ceil {day.DayWeek == 'Суббота' ? 'sbt' : ''}"
                >
                    <div>
                        {day.DatePair}
                    </div>
                    <div>
                        {day.DayWeek}
                    </div>

                    {#if formatDate(day.DatePair) === new Date()
                            .toISOString()
                            .slice(0, 10)}
                        <span
                            style="padding-right:5px; color:lime;font-weight:400"
                            >Сегодня</span
                        >
                    {/if}
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
                    justify-content: space-between;
                    height: 100%;"
                                class="pair-detail"
                            >
                                <div class="subj">
                                    {PairItem(day.Schedule, time).SubjSN}
                                </div>

                                <div style="margin:0; height:40px">
                                    <div
                                        style="text-align:right;font-size:0.8em; font-weight:400"
                                    >
                                        {PairItem(day.Schedule, time).Aud}
                                    </div>
                                    <div
                                        style="text-align:right;line-height:1em;font-size:0.8em; font-weight:400"
                                    >
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

<style>
    .sbt {
        background-color: black !important;
    }

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
        color: azure !important;
        padding: 0 5px;
        font-weight: 300;
    }
    .pair-ceil {
        font-weight: 300;
        /* background-color: rgb(215, 235, 250); */
        /* background-color: rgb(252 254 255); */
        background-color: rgb(215 235 250);
        padding: 5px;
    }

    /* .pair-detail div {
        padding: 0 3px;
    } */

    .subj {
        /* background-color: bisque; */
        color: rgb(5 19 19);
        font-size: 0.95em;
        line-height: 1.1em;
        height: 31px;
        text-shadow: 0px 0.5px 0.5px #6f7df3;
        /* Сделать media-query  для height
        border-top-left-radius: 0.5em; */
        /* border-top-right-radius: 1px solid #bfa8a8; */
        /* border-bottom: 1px solid #bfa8a8; */
    }

    .groups {
        /* background-color: rgb(230 170 114);
        color: white !important; */

        /* background-color: rgb(184 234 195); */
        background-color: rgb(234 184 198 / 42%);
        color: #071919 !important;
        /* margin-top: 3px; */
        /* font-size: 0.8em; */
        font-size: 0.8em;
        border-radius: 0.4em;
        word-break: break-all;
        min-height: 37px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    /* .pair-wrapper div {
        background-color: blue;
        font-weight: 300px !important;
    } */
</style>
