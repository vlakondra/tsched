<script>
    import { onMount } from "svelte";
    let firstDay, lastDay;
    let date = new Date(),
        y = date.getFullYear(),
        m = date.getMonth();
    let startDay = new Date(y, m, 2);
    let endDay = new Date(y, m + 1, 1);
    firstDay = startDay.toISOString().split("T")[0];
    lastDay = endDay.toISOString().split("T")[0];

    const compareDates = (x, d) => {
        console.log(new Date(Date.parse(d)));
        console.log(new Date(firstDay));
        console.log(new Date(firstDay) - new Date(lastDay));
        //https://stackoverflow.com/questions/4413590/javascript-get-array-of-dates-between-2-dates
    };
</script>

<div class="dates">
    <table>
        <tr>
            <td> Начало периода: </td>
            <td />
            <td> Конец периода: </td>
        </tr>
        <tr>
            <td>
                <input
                    on:change={(e) => {
                        compareDates(null, e.target.value);
                    }}
                    type="date"
                    class="input is-success"
                    bind:value={firstDay}
                />
            </td>
            <td style="vertical-align: middle;">
                <div class="defis" />
            </td>
            <td>
                <input
                    type="date"
                    bind:value={lastDay}
                    class="input is-success"
                />
            </td>
        </tr>
    </table>
</div>

<style>
    .dates {
        display: inline-flex;
    }
    table tr td:first-child,
    td:last-child {
        text-align: left;
        padding-bottom: 3px;
    }

    .defis {
        background-color: blue;
        border: 1px solid gray;
        display: block;
        height: 3px;
        position: static;
        width: 20px;
        margin: 0 3px;
    }
</style>
