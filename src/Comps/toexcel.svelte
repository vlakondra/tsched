<script>
    import { client_width } from "./store.js";
    import { scheddata, sched_data_loaded } from "./store";
    import Fa from "svelte-fa";
    import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
</script>

<button
    disabled={Object.keys($scheddata).length > 0 ? false : true}
    class="button is-info  is-normal to-center"
>
    <span class="icon">
        <Fa icon={faFileExcel} color="white" size="1x" />
    </span>
    <span>Сохранить в формате Excel</span>
</button>

<style>
    .to-center {
        display: block;
        margin: 30px auto;
    }
</style>
