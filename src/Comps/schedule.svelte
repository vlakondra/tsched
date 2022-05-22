<script>
    //https://github.com/langbamit/svelte-scrollto#readme
    import { onMount } from "svelte";
    import ShahSched from "./shahsched.svelte";

    import { format } from "date-fns";

    import { fade } from "svelte/transition";

    import Fa from "svelte-fa";
    import { faArrowCircleUp } from "@fortawesome/free-solid-svg-icons";

    onMount(() => {
        //позиционировать расписание на текущую дату
        let dp = document.getElementById(new Date().toISOString().slice(0, 10));
        setTimeout(() => {
            if (dp) {
                dp.scrollIntoView({ block: "start", behavior: "smooth" });
            }
        }, 1000);
    });

    const scrollToTop = () => {
        let dp = document.getElementById("0-month");
        if (dp) {
            dp.scrollIntoView({ block: "start", behavior: "smooth" });
        }
    };

    export let scrolly = 0;

    let schedVisible = true;
    const showSched = () => {
        schedVisible = !schedVisible;
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

    let sched = [
        {
            Month: "Май",
            DateDay: [
                {
                    DatePair: "04.05.2022",
                    DayWeek: "Среда",
                    DayWeekShort: "Ср",
                    Schedule: [
                        {
                            TimeStart: "08:30",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБСД-101",
                            Aud: "709/ГК",
                            FE_ID: 4,
                        },
                        {
                            TimeStart: "10:15",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБД-201",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБД-201",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "05.05.2022",
                    DayWeek: "Четверг",
                    DayWeekShort: "Чт",
                    Schedule: [
                        {
                            TimeStart: "12:00",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "БДД-101, ЭБД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-201, РСОД-201-д, УПД-201-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "15:50",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-201, РСОД-201-д, УПД-201-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "06.05.2022",
                    DayWeek: "Пятница",
                    DayWeekShort: "Пт",
                    Schedule: [
                        {
                            TimeStart: "10:15",
                            SubjName: "Общая физическая подготовка",
                            SubjSN: "Общая физ. подгов.",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-101, РСОД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-301 эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-301, УПД-301-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "15:50",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-201, РСОД-201-д, УПД-201-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "11.05.2022",
                    DayWeek: "Среда",
                    DayWeekShort: "Ср",
                    Schedule: [
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-201эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "12.05.2022",
                    DayWeek: "Четверг",
                    DayWeekShort: "Чт",
                    Schedule: [
                        {
                            TimeStart: "10:15",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "БДД-101, ЭБД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "13.05.2022",
                    DayWeek: "Пятница",
                    DayWeekShort: "Пт",
                    Schedule: [
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-301 эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "15:50",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-201эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "16.05.2022",
                    DayWeek: "Понедельник",
                    DayWeekShort: "Пн",
                    Schedule: [
                        {
                            TimeStart: "10:15",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-201эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБСД-101",
                            Aud: "709/ГК",
                            FE_ID: 4,
                        },
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-301, УПД-301-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "15:50",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-301, УПД-301-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "17.05.2022",
                    DayWeek: "Вторник",
                    DayWeekShort: "Вт",
                    Schedule: [
                        {
                            TimeStart: "08:30",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-201, РСОД-201-д, УПД-201-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "19.05.2022",
                    DayWeek: "Четверг",
                    DayWeekShort: "Чт",
                    Schedule: [
                        {
                            TimeStart: "12:00",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "БДД-101, ЭБД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "20.05.2022",
                    DayWeek: "Пятница",
                    DayWeekShort: "Пт",
                    Schedule: [
                        {
                            TimeStart: "08:30",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-301 эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "10:15",
                            SubjName: "Общая физическая подготовка",
                            SubjSN: "Общая физ. подгов.",
                            LoadKindSN: "Практ зан",
                            GSName: "МД-101, УПД-101, ЭД-101",
                            Aud: "712/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName: "Общая физическая подготовка",
                            SubjSN: "Общая физ. подгов.",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-101, РСОД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "23.05.2022",
                    DayWeek: "Понедельник",
                    DayWeekShort: "Пн",
                    Schedule: [
                        {
                            TimeStart: "08:30",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-301 эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "10:15",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБД-201",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБСД-101",
                            Aud: "709/ГК",
                            FE_ID: 4,
                        },
                        {
                            TimeStart: "15:50",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-201эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "24.05.2022",
                    DayWeek: "Вторник",
                    DayWeekShort: "Вт",
                    Schedule: [
                        {
                            TimeStart: "12:00",
                            SubjName: "Общая физическая подготовка",
                            SubjSN: "Общая физ. подгов.",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-101, РСОД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-301, УПД-301-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "15:50",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-201, РСОД-201-д, УПД-201-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "25.05.2022",
                    DayWeek: "Среда",
                    DayWeekShort: "Ср",
                    Schedule: [
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-201эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "15:50",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Зачет",
                            GSName: "ИД-201, РСОД-201-д, УПД-201-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "26.05.2022",
                    DayWeek: "Четверг",
                    DayWeekShort: "Чт",
                    Schedule: [
                        {
                            TimeStart: "08:30",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-201эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "10:15",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "БДД-101, ЭБД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-301 эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "27.05.2022",
                    DayWeek: "Пятница",
                    DayWeekShort: "Пт",
                    Schedule: [
                        {
                            TimeStart: "08:30",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБД-201",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "10:15",
                            SubjName: "Общая физическая подготовка",
                            SubjSN: "Общая физ. подгов.",
                            LoadKindSN: "Зачет",
                            GSName: "ИД-101, РСОД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName: "Общая физическая подготовка",
                            SubjSN: "Общая физ. подгов.",
                            LoadKindSN: "Практ зан",
                            GSName: "МД-101, УПД-101, ЭД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "14:05",
                            SubjName: "Общая физическая подготовка",
                            SubjSN: "Общая физ. подгов.",
                            LoadKindSN: "Зачет",
                            GSName: "УПД-101, ЭД-101",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "28.05.2022",
                    DayWeek: "Суббота",
                    DayWeekShort: "Сб",
                    Schedule: [
                        {
                            TimeStart: "10:15",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБСД-101",
                            Aud: "709/ГК",
                            FE_ID: 4,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБСД-101",
                            Aud: "709/ГК",
                            FE_ID: 4,
                        },
                    ],
                },
                {
                    DatePair: "30.05.2022",
                    DayWeek: "Понедельник",
                    DayWeekShort: "Пн",
                    Schedule: [
                        {
                            TimeStart: "10:15",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБСД-101",
                            Aud: "709/ГК",
                            FE_ID: 4,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Зачет",
                            GSName: "ЭД-301 эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "14:05",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-301, УПД-301-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
                {
                    DatePair: "31.05.2022",
                    DayWeek: "Вторник",
                    DayWeekShort: "Вт",
                    Schedule: [
                        {
                            TimeStart: "08:30",
                            SubjName: "Физическая культура",
                            SubjSN: "Физическая культура",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭБСД-101",
                            Aud: "709/ГК",
                            FE_ID: 4,
                        },
                        {
                            TimeStart: "10:15",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ЭД-201эпо-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                        {
                            TimeStart: "12:00",
                            SubjName:
                                "Элективные курсы по физической культуре и спорту",
                            SubjSN: "Эл курсы п/ф-ре и сп",
                            LoadKindSN: "Практ зан",
                            GSName: "ИД-301, УПД-301-д",
                            Aud: "709/ГК",
                            FE_ID: 1,
                        },
                    ],
                },
            ],
        },
    ];
</script>

{#if scrolly > 500}
    <div transition:fade on:click={scrollToTop} class="totop-box">
        <Fa icon={faArrowCircleUp} color="wheat" size="2.5x" />
    </div>
{/if}

<div class="container" style="display:none">
    <ShahSched {sched} />
</div>

<div class="container " style="margin-top:10px;">
    {#each sched as month, i}
        <div id={i + "-month"} on:click={showSched} class="month">
            <span> {month.Month}</span>
            <span
                >{PairCount(month.DateDay)} пар; {month.DateDay.length} дней</span
            >
        </div>
        {#if schedVisible}
            <div in:fade={{ duration: 1000 }} out:fade>
                {#each month.DateDay as day, i}
                    <div
                        id={formatDate(day.DatePair)}
                        class="day {day.DayWeek == 'Суббота' ? 'sbt' : ''}"
                    >
                        <span>
                            {day.DatePair}
                            <span style="margin-left:10px;">
                                {day.DayWeek}</span
                            >
                        </span>
                        {#if formatDate(day.DatePair) === new Date()
                                .toISOString()
                                .slice(0, 10)}
                            <span
                                style="padding-right:5px; color:lime;font-weight:400"
                                >Сегодня</span
                            >
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

<style>
    .sbt {
        font-weight: 600 !important;
        color: rgb(234, 249, 252) !important;
    }
    /* .container {
        font-family: "Roboto";
    } */
    .month {
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
    }
    .month span {
        border-bottom: 1px solid blue;
        font-style: oblique;
    }
    .day {
        background-color: rgb(136, 120, 243);
        color: whitesmoke;
        padding: 1px 0 1px 5px;
        letter-spacing: 0.9px;
        font-weight: 300;
        display: flex;
        justify-content: space-between;

        /* border-bottom: 1px solid silver; */
    }

    .pair-wrapper {
        display: grid;
        /* gap: 10px; */
        grid-template-columns: 65px 1fr 80px 100px 65px;
        grid-template-areas: "timestart subjname kind group aud";
        border-bottom: 1px solid wheat;
        font-weight: 300;
        /* ??? сделать фон и рамка на подложке или в этом классе */
        background-color: rgb(215, 235, 250);
    }

    .time-start {
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
    }

    /* @media (min-width: 501px) {
        .pair-wrapper {
            grid-template-columns: 65px auto;
            grid-template-areas:
                "timestart"
                "subjmame";
        }
    } */

    @media (min-width: 501px) {
        .pair-wrapper {
            grid-template-columns: 65px 1fr 100px 100px 65px;
            /* gap: 10px !important; ??*/
        }
        .pair-wrapper div {
            border-right: 1px solid silver;
            padding: 5px;
        }
        .pair-wrapper *:not(.subj-name) {
            text-align: left;
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
            color: whitesmoke;
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

    .totop-box {
        position: fixed;
        left: 80%;
        top: 80%;
        cursor: pointer;
        z-index: 99;
    }
</style>
