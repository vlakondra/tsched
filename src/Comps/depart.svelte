<script>
  import departData from "./store.js";
  import { depart_id, teacher_id } from "./store.js";

  let selDep_ID;
  let selTchr_ID;

  const [loading, error, data] = departData();

  const onDepSelected = (e) => {
    depart_id.update(() => e.target.value);
    teacher_id.update(() => null);
    selTchr_ID = "null"; //Установим преп-ля в placeholder
  };

  const onTchrSelected = (e) => {
    teacher_id.update(() => e.target.value);
  };
</script>

{selDep_ID}-{selTchr_ID}

<div>
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
        <select
          bind:value={selTchr_ID}
          on:change={(v) => onTchrSelected(v)}
          on:blur={undefined}
        >
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
</div>

<style>
  .field {
    width: 90%;
    margin: 10px auto;
  }
  .field .label {
    font-weight: 100;
    margin-bottom: 3px;
    color: #3488ce;
  }
  .select {
    display: block;
  }
  .select select {
    width: 100%;
  }
  @media (max-width: 500px) {
    .select {
      font-size: 0.8em;
    }
  }
</style>
