<script>
    import {
        formatDistance,
        subDays,
        add,
        lastDayOfMonth,
        format,
    } from "date-fns";
    import { ru } from "date-fns/locale";
    import { onMount } from "svelte";

    // let x = formatDistance(
    //     subDays(new Date(), 3),
    //     new Date(),
    //     {
    //         addSuffix: true,
    //     },
    //     { locale: ru }
    // );

    const formatDate = (d) => {
        let frm = "yyyy-MM-dd";
        console.log("frmData", d);
        if (d) {
            return format(d, frm);
        } else {
            return format(new Date(), frm);
        }
    };

    let currdate = new Date();

    // let startDate = format(currdate.setDate(1), frm);
    let startDate = currdate.setDate(1); //1-й день тек. мес.
    let frmStartDate = formatDate(startDate);
    // $: tmp = frmStartDate;

    let frmMinStartDate = formatDate(add(currdate.setDate(1), { months: -1 }));
    let frmMaxStartDate = formatDate(add(currdate.setDate(1), { months: 2 }));

    let endDate = currdate.setDate(lastDayOfMonth(currdate).getDate()); //посл. день тек. мес.
    let frmEndDate = formatDate(endDate);
    //min endDate д.б. не больше выбранной startDate

    const compareDates = (start, end) => {
        console.log(frmEndDate);
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
                    on:change={(v) => compareDates(v)}
                    type="date"
                    min={frmMinStartDate}
                    max={frmMaxStartDate}
                    bind:value={frmStartDate}
                    required
                    class="input is-success"
                />
                <span class="validity" />
            </td>
            <td style="vertical-align: middle;">
                <div class="defis" />
            </td>
            <td>
                <input
                    type="date"
                    min={frmStartDate ? frmStartDate : formatDate(new Date())}
                    max={frmStartDate
                        ? formatDate(add(startDate, { months: 2 }))
                        : formatDate(new Date())}
                    bind:value={frmEndDate}
                    required
                    class="input is-success"
                />
            </td>
        </tr>
        <tr>
            <td><span class="validity" /></td>
            <td />
            <td><span class="validity" /></td>
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

    /* input:invalid + span:after {
        content: "✖";
        padding-left: 5px;
    }

    input:valid + span:after {
        content: "✓";
        padding-left: 5px;
    } */
</style>
