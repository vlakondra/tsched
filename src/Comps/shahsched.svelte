<script>
    let pairs = [
        "",
        "08:30",
        "10:15",
        "12:00",
        "14:05",
        "15:50",
        "17:35",
        "19:15",
        "20:55",
    ];

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

    const indexPair = (timepair) => {
        return pairs.indexOf(timepair);
    };

    export let sched;
    let startRow = 3;
    let startCol = 1;
    let sC = 2;

    const sr = () => {
        startRow++;
        return startRow;
    };

    const PairItem = (sch, ptime) => {
        return sch.find((e) => e.TimeStart == ptime);
    };

    // let Sch;
    // const setSch = (sch) => {
    //     Sch = sch;
    //     console.log("SCH? ", Sch);
    // };
    let w;
</script>

<svelte:window bind:outerWidth={w} />

<h1>SHAHSCHED {w}</h1>
<div class="pair-wrapper" style="background-color:aqua">
    {#each pairs as timePair, i}
        <div
            style=" grid-column: {i + 1} / {i + 2}; grid-row: 1 / 2;padding:5px"
        >
            {timePair}
        </div>
    {/each}
    <!-- <div style="grid-column: 2 / 10; grid-row: 2 / 3;">Май 2022</div>
    <div style="grid-column: 2 / 3; grid-row: 3 / 4;max-width:120px">
        Физическая культура
    </div> -->
    {#each sched as month, i}
        <div style="grid-column: 1 / 10; grid-row: {2} / {3}; padding:5px">
            {month.Month}
        </div>
        {#each month.DateDay as day, i}
            <div
                style="grid-column: {startCol} / {startCol +
                    1}; grid-row: {startRow + i} / {startRow +
                    i +
                    1};padding:5px "
            >
                <div>
                    {day.DatePair}
                </div>
                <div>
                    {day.DayWeek}
                </div>
                <!-- {setSch([...day.Schedule])} -->
            </div>

            <!-- Переделать на Object.entries
                https://www.eternaldev.com/blog/5-ways-to-perform-for-loop-in-svelte-each-block/ -->
            <!-- {#each { length: 8 } as _, j} -->
            {#each Object.entries(timepairs) as [pair, time], j}
                <div
                    style="grid-column: {time + 1} / {time + 2}; grid-row: {i +
                        3} / {i + 4}"
                >
                    <!-- {#if day.Schedule.findIndex((el) => el.TimeStart == pairs[j + 1]) == -1} -->
                    {#if day.Schedule.findIndex((el) => el.TimeStart == time) == -1}
                        {""}
                    {:else}
                        <div
                            style="padding:5px;    display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        height: 100%;"
                        >
                            <div title={PairItem(day.Schedule, time).TimeStart}>
                                {PairItem(day.Schedule, time).SubjSN}
                            </div>
                            <div>
                                {PairItem(day.Schedule, time).LoadKindSN}
                            </div>
                            <div
                                style="line-height:1.1em;font-size:0.8em;padding:3px"
                            >
                                {PairItem(day.Schedule, time).GSName}
                            </div>

                            <!-- {PairItem(day.Schedule, pairs[j + 1]).GSName}-->

                            <div
                                style="color:azure; background-color:burlywood; padding: 3px 0"
                            >
                                {PairItem(day.Schedule, time).Aud}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        {/each}
    {/each}
</div>

<style>
    .pair-wrapper {
        display: grid;
        gap: 1px;
        background-color: rgb(226, 171, 171);
        grid-template-columns: repeat(8, auto);
        /* grid-template-columns: repeat(8,auto);// auto auto auto auto auto auto auto auto; */
        grid-template-rows: auto;
    }
    .pair-wrapper div {
        background-color: blue;
        font-weight: 300px !important;
    }
</style>
