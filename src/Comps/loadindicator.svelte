<script>
    import { fade } from "svelte/transition";
    export let isdata = false;
</script>

{#if !isdata}
    <div transition:fade class="load-indicator">
        <span class="icon is-large">
            <span class="fa-stack fa-lg">
                <i class="fas fa-spinner fa-pulse" />
            </span>
        </span>
    </div>
{/if}

<style>
    .load-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translateY(-50%);
    }
    .load-indicator i {
        color: blue;
        font-size: 5.5vw;
    }
</style>
