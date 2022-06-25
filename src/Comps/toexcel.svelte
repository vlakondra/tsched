<script>
    import { client_width } from "./store.js";
    import Fa from "svelte-fa";
    import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
</script>

<button class="button is-primary  is-medium">
    <span class="icon">
        <Fa icon={faFileExcel} color="wheat" size="1x" />
    </span>
    <span>Сохранить в формате Excel</span>
</button>
