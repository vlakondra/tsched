<script>
    import { load_sched_data } from "./store.js";
    import Fa from "svelte-fa";
    import { faSpinner } from "@fortawesome/free-solid-svg-icons";
</script>

{#if $load_sched_data}
    <div class="progbar">
        <Fa icon={faSpinner} size="3x" spin color="blue" />
    </div>
{/if}

<style>
    .progbar {
        position: absolute;
        z-index: 9999;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin-top: 20px;
    }
</style>
