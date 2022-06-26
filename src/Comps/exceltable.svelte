<script>
    import { scheddata } from "./store";
    import { timepairs } from "./util.js";

    const PairItem = (sch, ptime) => {
        return sch.find((e) => e.TimeStart == ptime);
    };
    const ColsWidths = (d) => {
        let widths = Array.from(
            { length: Object.keys(timepairs).length + 1 },
            () => "10"
        ); //массив ширин по умолчению

        for (const [k, time] of Object.entries(timepairs)) {
            for (const month of d) {
                for (const day of month.DateDay) {
                    let pair_is = day.Schedule.findIndex(
                        (p) => p.TimeStart === time
                    );
                    if (pair_is != -1) widths[k] = "25";
                }
            }
        }
        widths[0] = 17;
        return widths.join();
    };
</script>

{#if Object.keys($scheddata).length}
    <div style="visibility:collapse; height:0px; width:0px">
        <table id="schtable" data-cols-width={ColsWidths($scheddata)}>
            <tbody>
                {#each $scheddata as month, m}
                    <tr>
                        <td
                            colspan="9"
                            data-f-sz="14"
                            data-f-bold="true"
                            data-f-color="fe0404">{month.Month}</td
                        >
                    </tr>
                    <tr>
                        <td
                            data-f-name="Arial"
                            data-f-bold="true"
                            data-f-color="0e2ff6"
                        >
                            Дата/Время
                        </td>
                        {#each Object.entries(timepairs) as [n_pair, time], n}
                            <td
                                data-f-name="Arial"
                                data-f-bold="true"
                                data-f-color="0e2ff6"
                            >
                                {time}
                            </td>
                        {/each}
                    </tr>
                    {#each month.DateDay as day, d}
                        <tr>
                            <td
                                data-a-wrap="true"
                                data-a-v="middle"
                                data-f-name="Arial"
                                data-f-bold="true"
                                data-f-color="2d324e"
                            >
                                {day.DatePair}
                                <br />
                                {day.DayWeek}
                            </td>

                            {#each Object.entries(timepairs) as [n_pair, time]}
                                {#if day.Schedule.findIndex((el) => el.TimeStart == time) == -1}
                                    <td>{""}</td>
                                {:else}
                                    <td data-a-wrap="true" data-a-v="top">
                                        {PairItem(day.Schedule, time)
                                            .SubjName}<br />

                                        {PairItem(day.Schedule, time)
                                            .LoadKindSN} -
                                        {PairItem(day.Schedule, time).Aud}<br />

                                        {PairItem(day.Schedule, time).GSName}
                                    </td>
                                {/if}
                            {/each}
                        </tr>
                    {/each}
                {/each}
            </tbody>
        </table>
    </div>
{/if}
