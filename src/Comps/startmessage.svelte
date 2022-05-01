<script>
</script>

<div class="start-message" style="">
    <div style="position:relative">
        <i
            class="fas fa-user-clock"
            style=" font-weight: 600; font-size: 200px; color: rgb(208 175 132 / 37%);"
        />
    </div>
    <div style="position:relative;top: -50%;">
        Расписание на апрель 2022 <br />
        <span style="background:transparent; color:rosybrown" class="button"
            >cоставлено.</span
        ><br /><br />
        <button style="color:rosybrown" class="button" on:click={() => true}
            >Выберите преподавателя</button
        >
    </div>
</div>

<style>
    .start-message {
        position: absolute;
        width: 280px;
        height: 280px;
        margin: 0 auto;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        resize: vertical;
        /* overflow: auto; */
    }
</style>
