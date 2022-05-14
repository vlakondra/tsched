<script>
    import { onMount } from "svelte";
</script>

<div class="container " style="background:aqua;padding:5px">
    <div class="wrapper">
        <div class="date">16.05.2022, Понедельник</div>
        <div class="time">08:30</div>
        <div class="subject">
            Разработка, внедрение и адаптация программного обеспечения
            отраслевой направленности
        </div>
        <div class="kind">Практ зан</div>
        <div class="groups">ИПД-301, ИПСД-201</div>
        <div class="aud">607/ГК</div>
    </div>

    <div class="wrapper" style="margin-top:-1em">
        <div class="time">10:15</div>
        <div class="subject">
            Разработка, внедрение и адаптация программного обеспечения
            отраслевой направленности
        </div>
        <div class="kind">Практ зан</div>
        <div class="groups">ИПД-301, ИПСД-201</div>
        <div class="aud">607/ГК</div>
    </div>
</div>

<style>
    .wrapper {
        display: grid;
        grid-template-columns: 65px 1fr 65px;
        grid-template-rows: repeat(3, minmax(1em, auto));
        /* grid-auto-rows: minmax(30px, auto); */
        /* grid-template-columns: ; */
        background-color: aliceblue;
        margin-bottom: 2px;
    }
    .wrapper div {
        align-self: center;
        height: 100%;

        display: flex;
        /* align-content: center; */
        justify-content: center;
        align-items: center;
    }
    .date {
        grid-column: 1/4;
        background-color: blue;
        color: snow;
        justify-content: start !important;
    }
    .time {
        grid-column: 1/2;
        grid-row: 2/4;
        border: 1px solid gray;
        background-color: red;
        color: snow;
    }
    .subject {
        grid-column: 2/3;
        grid-row: 2/3;
        padding: 5px;
        background-color: darkkhaki;
        color: snow;
    }

    .kind {
        grid-column: 2/3;
        grid-row: 3/4;
        width: 50%;
        background-color: #8e8cf0;
        color: snow;
        height: 100%;
        /* padding-right: 5px; */
    }
    .groups {
        grid-column: 2/3;
        grid-row: 3/4;
        border-left: 1px solid gray;
        margin-left: 50%;
        background-color: #8e8cf0;
        color: snow;
        text-align: right;
    }
    .aud {
        grid-column: 3/4;
        grid-row: 2/4;
        background-color: red;
        color: snow;
        text-align: center;
    }
    /*
 
    .kind {
        grid-column: 2/3;
        grid-row: 3/4;
        border: 1px solid gray;
        width: 80px;
    }
    .groups {
        grid-column: 3/4;
        grid-row: 3/4;
        border: 1px solid gray;
    } */
</style>
