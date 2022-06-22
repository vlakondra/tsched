<script>
    import { d_start, d_end } from "./store.js";
</script>

<div class="card no-schedule">
    <div class="card-content">
        <div class="content">
            Расписание
            <br />
            на период
            <br />
            {new Date($d_start).toLocaleDateString("ru-RU")}-{new Date(
                $d_end
            ).toLocaleDateString("ru-RU")}
            <br />
            не составлено
        </div>
    </div>
</div>

<style type="text/scss">
    // $button-light: rgba(0, 125, 141, 0.75);
    // $button-hover: rgba(0, 125, 141, 1);
    // $text-color: #efefef;
    // $bg-color: rgb(19, 255, 6);

    .no-schedule {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.25em;
        letter-spacing: 1px;
        text-align: center;
        background-color: #00bbd1;
        color: white;
        box-shadow: 4px 4px 4px 0px grey;
    }
</style>
