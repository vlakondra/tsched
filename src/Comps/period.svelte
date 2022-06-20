<script>
    import {
        depart_id,
        teacher_id,
        d_start,
        d_end,
        getSched,
    } from "./store.js";

    import { add, lastDayOfMonth, format } from "date-fns";
    //https://date-fns.org/v2.28.0/docs/add

    import Fa from "svelte-fa";
    import { faSync } from "@fortawesome/free-solid-svg-icons";

    const formatDate = (d) => {
        let frm = "yyyy-MM-dd";
        if (d) {
            return format(d, frm);
        } else {
            return format(new Date(), frm);
        }
    };

    let currdate = new Date();

    let startDate = currdate.setDate(1); //1-й день тек. мес.
    let frmStartDate = formatDate(startDate);

    let frmMinStartDate = formatDate(currdate.setDate(1));
    let frmMaxStartDate = formatDate(lastDayOfMonth(currdate));

    let endDate = currdate.setDate(lastDayOfMonth(currdate).getDate()); //посл. день тек. мес.
    let frmEndDate = formatDate(endDate);

    let frmMinEndDate = formatDate(currdate.setDate(2));
    let frmMaxEndDate = formatDate(
        add(lastDayOfMonth(currdate), { months: 2 })
    );
    let errMessage = "";

    //привязка store-writable переменных к значениям input'ов
    $: d_start.update(() => frmStartDate);
    $: d_end.update(() => frmEndDate);

    //endDate д.б. не больше выбранной startDate
    const compareDates = () => {
        if (new Date(frmEndDate) < new Date(frmStartDate)) {
            frmEndDate = frmStartDate;
            return;
        }
        if (new Date(frmEndDate) > new Date(frmMaxEndDate)) {
            frmEndDate = frmMaxEndDate;
            return;
        }

        if (!frmStartDate || !frmEndDate) {
            errMessage = "Установите даты периода";
            return;
        } else {
            errMessage = "";
        }
    };
</script>

<div class="calendar-wrapper">
    <div class="calendar-inputs">
        <div>
            <div class="calendar-txt">Начало периода:</div>
            <div>
                <input
                    type="date"
                    on:change={() => compareDates()}
                    min={frmMinStartDate}
                    max={frmMaxStartDate}
                    bind:value={frmStartDate}
                    required
                    class="input is-success"
                />
            </div>
        </div>

        <div>
            <div class="calendar-txt">Конец периода:</div>
            <div>
                <input
                    type="date"
                    on:change={() => compareDates()}
                    min={frmMinEndDate}
                    max={frmMaxEndDate}
                    bind:value={frmEndDate}
                    required
                    class="input is-success"
                />
            </div>

            {#if !errMessage}
                <div style="padding:5px 0">
                    <button
                        class="button is-small is-info "
                        on:click={() => getSched(555)}
                        disabled={errMessage || !$depart_id || !$teacher_id
                            ? true
                            : false}
                    >
                        <span class="icon">
                            <Fa icon={faSync} size="1.5x" />
                        </span>

                        <span>Обновить</span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
    <div class="error-row">
        {#if errMessage}
            <span class="errmessage"> {errMessage}</span>
        {/if}
    </div>
</div>

<style>
    .calendar-wrapper {
        padding: 10px 0;
    }
    .calendar-inputs {
        display: flex;
    }

    button {
        width: 100%;
    }

    .error-row {
        text-align: center;
    }
    @media (min-width: 500.5px) {
        .calendar-inputs {
            justify-content: space-around;
        }

        input {
            width: 120px !important;
            padding: 0 3px;
            font-size: 0.95rem;
            font-family: Roboto;
        }
    }

    @media (max-width: 500px) {
        .calendar-inputs {
            justify-content: space-evenly;
        }

        .calendar-txt {
            color: #3488ce;
        }
        input {
            width: 115px !important;
            padding: 0 3px;
            font-size: 0.85rem;
            font-family: Roboto;
        }
    }
    .errmessage {
        color: red;
        letter-spacing: 1px;
        font-weight: 400;
    }
</style>
