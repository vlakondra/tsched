<script>
</script>

<i class="fas fa-user-clock sched-image" />

<div class="start-message">
    Расписание на апрель 2022 <br />
    <span style="background:transparent; color:rosybrown" class="button"
        >cоставлено.</span
    ><br /><br />
    <button style="color:rosybrown" class="button" on:click={() => true}
        >Выберите преподавателя</button
    >

    <!-- var options = {  year: 'numeric', month: 'long' };
    date.toLocaleDateString('ru-RU', options) -->
</div>

<style>
    .sched-image {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin-top: 20px;
        font-size: 30vw;
        color: rgb(208 175 132 / 10%);
        resize: vertical;
    }

    .start-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin-top: 20px;
    }
</style>
