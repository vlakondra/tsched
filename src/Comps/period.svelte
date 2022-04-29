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

    let startDate = currdate.setDate(1); //1-й день тек. мес.
    let frmStartDate = formatDate(startDate);
    // $: tmp = frmStartDate;

    let frmMinStartDate = formatDate(add(currdate.setDate(1), { months: -1 }));
    let frmMaxStartDate = formatDate(add(currdate.setDate(1), { months: 2 }));

    let endDate = currdate.setDate(lastDayOfMonth(currdate).getDate()); //посл. день тек. мес.
    let frmEndDate = formatDate(endDate);
    //min endDate д.б. не больше выбранной startDate

    const compareDates = (comp) => {
        if (comp == "start") {
            console.log("START");
            //если начал. дата обнуляется, обнуляем и конечную,
            if (!frmStartDate) {
                frmEndDate = undefined;
                setTimeout(() => {
                    prompt("!!!");
                }, 1000);
            } else {
                //иначе добавляем к startDate 1 мес
                frmEndDate = formatDate(
                    add(new Date(frmStartDate), { months: 1 })
                );
            }
        } else if (comp == "end") {
            console.log("END");
        }
        console.log("start", frmStartDate);
        console.log("end", frmEndDate);

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
                    type="date"
                    on:change={() => compareDates("start")}
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
                    on:change={() => compareDates("end")}
                    min={frmStartDate ? frmStartDate : formatDate(new Date())}
                    max={frmStartDate
                        ? formatDate(add(startDate, { months: 3 }))
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
