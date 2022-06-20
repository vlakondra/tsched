<script>
    //https://github.com/langbamit/svelte-scrollto#readme
    import { scheddata, sched_data_loaded } from "./store";
    import Noschedule from "./noschedule.svelte";
    // import { format } from "date-fns";
    import { isToday, toEnDate } from "./util";
    import { fade } from "svelte/transition";

    const PairCount = (daysArr) => {
        //считает кол-во пар в мес.
        let pcount = 0;
        daysArr.forEach((day) => {
            pcount += day["Schedule"].length;
        });
        return pcount;
    };

    let shows = Array($scheddata.length).fill(true);
</script>

{#if Object.keys($scheddata).length}
    <div class="container " style="margin-top:10px;">
        {#each $scheddata as month, i}
            <div
                id={i + "-month"}
                on:click={() => (shows[i] = !shows[i])}
                class="month"
            >
                <span> {month.Month}</span>
                <span
                    >{PairCount(month.DateDay)} пар; {month.DateDay.length} дней</span
                >
            </div>
            <!-- PairCount есть в обоих компонентах - сделать их в одном модуле -->
            {#if shows[i]}
                <div in:fade={{ duration: 1000 }} out:fade>
                    {#each month.DateDay as day, i}
                        <div
                            id={toEnDate(day.DatePair)}
                            class="day {day.DayWeek == 'Суббота'
                                ? 'sbt'
                                : ''}  {isToday(day.DatePair) ? 'today' : ''}"
                        >
                            <span>
                                {day.DatePair}
                                <span style="margin-left:10px;">
                                    {day.DayWeek}</span
                                >
                            </span>

                            {#if isToday(day.DatePair)}
                                <span class="today-lbl">Сегодня</span>
                            {/if}
                        </div>
                        {#each day.Schedule as pair, i}
                            <div class="pair-wrapper">
                                <div class="time-start">
                                    {pair.TimeStart}
                                </div>
                                <div class="subj-name">
                                    <span> {pair.SubjName} </span>
                                </div>
                                <div class="kind">
                                    <span>
                                        {pair.LoadKindSN}
                                    </span>
                                </div>
                                <div class="group">
                                    <span>
                                        {pair.GSName}
                                    </span>
                                </div>
                                <div class="aud">
                                    {pair.Aud}
                                </div>
                            </div>
                        {/each}
                    {/each}
                </div>
            {/if}
        {/each}
    </div>
{:else if $sched_data_loaded}
    <Noschedule />
{/if}

<style>
    .sbt {
        color: rgb(234, 249, 252) !important;
    }
    .today {
        font-size: 1.15em;
        /* color: blue; */
        background-color: darkturquoise !important;
    }

    .today-lbl {
        padding-right: 5px;
        color: white;
        letter-spacing: 1px;
    }

    /* .month {
        cursor: pointer;
        border-top-left-radius: 0.7em;
        border-top-right-radius: 0.7em;
        padding: 5px 7px;
        background-color: gainsboro;
        color: blueviolet;
        border-bottom: 1px solid blue;
        font-style: oblique;
        letter-spacing: 2px;
        font-size: 1.1em;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
    } */
    .month span {
        border-bottom: 1px solid rgb(133, 133, 243);
        font-style: oblique;
    }

    .day {
        /* background-color: rgb(136, 120, 243); */
        display: flex;
        justify-content: space-between;
        background-color: #7bdc7f;
        border-bottom: 3px solid rgb(164 115 115);
        color: rgb(80, 55, 55);
        padding: 1px 0 1px 5px;
        letter-spacing: 0.9px;
    }

    .pair-wrapper {
        display: grid;
        grid-template-columns: 65px 1fr 80px 160px 65px;
        /* ??? */
        gap: 0.8px 0.8px;

        /* grid-template-areas: "timestart subjname kind group aud"; */
        /* border-bottom: 1px solid wheat; */
        /* font-weight: 300; */
        /* ??? сделать фон и рамка на подложке или в этом классе */
        /* background-color: rgb(215, 235, 250); */

        /* background-color: blue !important; */
        margin-bottom: 1px;
    }

    /* .time-start {
        grid-area: timestart;
    }
    .subj-name {
        grid-area: subjname;
    }
    .kind {
        grid-area: kind;
    }
    .group {
        grid-area: group;
    }
    .aud {
        grid-area: aud;
    } */

    /* @media (min-width: 501px) {
        .pair-wrapper {
            grid-template-columns: 65px auto;
            grid-template-areas:
                "timestart"
                "subjmame";
        }
    } */

    @media (min-width: 501px) {
        /* .pair-wrapper {
            grid-template-columns: 65px 1fr 100px 160px 65px;
            gap: 0.8px 0.8px;
        } */
        .subj-name {
            min-width: 160px;
        }

        .pair-wrapper div {
            /* border-right: 1px solid silver; */
            padding: 5px;
            background-color: #f1fff7; /* #e9e9f6;*/
            /* margin-bottom: 0.8px; */
        }
        .pair-wrapper *:not(.subj-name) {
            text-align: left;
        }
        .time-start {
            background-color: #7bdc7f !important;
            color: rgb(53, 11, 11);
        }
    }

    @media (max-width: 500px) {
        .pair-wrapper {
            grid-template-columns: 65px 1fr 65px;
            grid-template-rows: auto;
            gap: 0px 0px;
            /* grid-template-areas:
                "timestart subjname aud"
                ". kind  ."; */
        }
        .time-start {
            grid-column: 1 / 2;
            grid-row: 1 / 4;
            text-align: center;
            padding-top: 5px;
            background-color: rgb(221, 137, 137);
            color: white;
        }
        .subj-name {
            grid-column: 2 / 3;
            grid-row: 1 / 2;
            padding: 5px 5px;
            letter-spacing: 0.2px;
            background-color: #368483;
            /* background-color: #2b706f; !!*/
            /* color: darkblue; */
            color: rgb(231, 228, 228);
            /*background-color: #f1fff7; */
        }
        .aud {
            grid-column: 3 / 4;
            grid-row: 1 / 3;
            text-align: center;
            padding-top: 5px;
            background-color: rgb(221, 137, 137);
            color: white;
            /* height: 100%; */
        }
        .kind {
            grid-column: 2 / 3;
            grid-row: 2 / 3;
            font-size: 70%;
            font-weight: 600;
            background-color: #dddfff;
            color: #7e7575;
        }
        .group {
            grid-column: 2 / 3;
            grid-row: 2 / 3;
            margin-left: 80px;
            text-align: right;
            padding-right: 8px;
            font-size: 70%;
            font-weight: 600;
            color: #7e7575;
        }
        /* .group {
            grid-area: kind;
            margin-left: 80px;
        } */
    }

    /* .totop-box {
        position: fixed;
        left: 80%;
        top: 80%;
        cursor: pointer;
        z-index: 99999;
    } */
</style>
