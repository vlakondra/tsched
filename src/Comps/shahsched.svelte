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
    const indexPair = (timepair) => {
        return pairs.indexOf(timepair);
    };

    export let sched;
    let w = 4;
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
</script>

<!-- {#each {length: 3} as _, i}
    <li>{i + 1}</li>
{/each} -->

<h1>SHAHSCHED</h1>
<div class="pair-wrapper" style="background-color:aqua">
    {#each pairs as timePair, i}
        <div style=" grid-column: {i + 1} / {i + 2}; grid-row: 1 / 2;">
            {timePair}
        </div>
    {/each}
    <!-- <div style="grid-column: 2 / 10; grid-row: 2 / 3;">Май 2022</div>
    <div style="grid-column: 2 / 3; grid-row: 3 / 4;max-width:120px">
        Физическая культура
    </div> -->
    {#each sched as month, i}
        <div style="grid-column: 1 / 10; grid-row: {2} / {3};">
            {month.Month}
        </div>
        {#each month.DateDay as day, i}
            <div
                style="grid-column: {startCol} / {startCol +
                    1}; grid-row: {startRow + i} / {startRow + i + 1};"
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
            {#each { length: 8 } as _, j}
                <div
                    style="grid-column: {j + 2} / {j + 3}; grid-row: {i +
                        3} / {i + 4};"
                >
                    {#if day.Schedule.findIndex((el) => el.TimeStart == pairs[j + 1]) == -1}
                        {""}
                    {:else}
                        <div>
                            {PairItem(day.Schedule, pairs[j + 1]).SubjSN}
                        </div>
                        <div>
                            {PairItem(day.Schedule, pairs[j + 1]).TimeStart}
                        </div>
                        {PairItem(day.Schedule, pairs[j + 1]).GSName}
                        {PairItem(day.Schedule, pairs[j + 1]).GSName}
                        {PairItem(day.Schedule, pairs[j + 1]).Aud}

                        {PairItem(day.Schedule, pairs[j + 1]).LoadKindSN}
                        <!-- {Sch.find((e) => e.TimeStart == pairs[j + 1])
                            .LoadKindSN} -->
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

        grid-template-columns: auto auto auto auto auto auto auto auto;
        grid-template-rows: auto;
    }
    .pair-wrapper div {
        background-color: blue;
    }
</style>
