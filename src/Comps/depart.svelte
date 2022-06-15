<script>
  import departData from "./store.js";

  let selDep_ID;
  let selTchr_ID;

  const [loading, error, data] = departData();

  const onDepSelected = (e) => {
    selTchr_ID = "null"; //Установим преп-ля в placeholder
  };
</script>

{selDep_ID}-{selTchr_ID}

<div class="field">
  <label class="label">Кафедра:</label>
  <div class="control">
    <div class="select is-success">
      <select
        bind:value={selDep_ID}
        on:change={(v) => onDepSelected(v)}
        on:blur={undefined}
      >
        <option value="null" selected disabled>Выберите кафедру</option>
        {#if $data.Departs}
          {#each $data.Departs as item}
            <option value={item.Depart_ID}>
              {item.DepartName}
            </option>
          {/each}
        {/if}
      </select>
    </div>
  </div>
</div>

<div class="field">
  <label class="label">Преподаватель:</label>
  <div class="control">
    <div class="select is-success">
      <select bind:value={selTchr_ID} style="width:287px">
        <option value="null" selected disabled>Выберите преподавателя</option>
        {#if $data.Teachers}
          {#each $data.Teachers.filter((t) => t.Depart_ID == selDep_ID) as item}
            <option value={item.Emp_ID}>
              {item.FIO}
            </option>
          {/each}
        {/if}
      </select>
    </div>
  </div>
</div>

<style>
  .field .label {
    font-weight: 100;
    margin-bottom: 3px;
    color: rgb(159 159 226);
  }
  .select {
    width: 287px;
  }
</style>
