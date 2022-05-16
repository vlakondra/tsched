<script>
    let pairs = [
        "",
        "08:30",
        "10:15",
        "12:00",
        "14:05",
        "15:50",
        "17:35",
        "19:15",
        "20:55",
    ];
    let w = 4;
</script>

<h1>SHAHSCHED</h1>
<div class="pair-wrapper">
    {#each pairs as item, i}
        <div style="grid-column: {i + 1} / {i + 2}; grid-row: 1 / 2;">
            {item}
        </div>
    {/each}
    <div style="grid-column: 2 / 10; grid-row: 2 / 3;">Май 2022</div>
    <div style="grid-column: 2 / 3; grid-row: 3 / 4;max-width:120px">
        Физическая культура
    </div>
</div>

<style>
    .pair-wrapper {
        display: grid;
        background-color: rgb(226, 171, 171);

        gap: 5px;
        grid-template-columns: auto auto auto auto auto auto auto auto;
        grid-template-rows: auto;
    }
</style>
