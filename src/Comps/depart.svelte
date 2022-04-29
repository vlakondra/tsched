<script>
  import { onMount } from "svelte";

  const esc = encodeURIComponent;
  const url = "https://old.ursei.su/Services/GetTeachersIniData?";
  const params = {
    d: new Date().toISOString().slice(0, 10),
  };

  const query = Object.keys(params)
    .map((k) => `${esc(k)}=${esc(params[k])}`)
    .join("&");

  let depjs = [];
  let tchrjs = [];
  let selDep_ID;
  let selTchr_ID;

  onMount(async () => {
    const res = await fetch(url + query);
    const jsres = await res.json();

    depjs = jsres["Departs"];
    tchrjs = jsres["Teachers"];
  });

  const onDepSelected = (e) => {
    selTchr_ID = "null"; //Установим преп-ля в placeholder
  };
</script>

<div
  style="display: flex;flex-direction:row; align-items: center; justify-content: center;"
>
  <div style="padding-right: 5px;">Кафедра</div>

  <div class="dep_select">
    <div class="control has-icons-left">
      <div class="select is-success">
        <select
          bind:value={selDep_ID}
          on:change={(v) => onDepSelected(v)}
          on:blur={undefined}
        >
          <option value="null" selected disabled>Выберите кафедру</option>

          {#each depjs as item, i}
            <option value={item.Depart_ID}>
              {item.DepartName}
            </option>
          {/each}
        </select>
      </div>
      <span class="icon is-medium is-left">
        <i class="fas fa-sitemap" />
        <!-- <i class="fas fa-chalkboard-teacher" />
      <i class="fas fa-diagnoses" /> -->
      </span>
    </div>
  </div>
</div>
{selDep_ID}-{selTchr_ID}
<div class="dep_select">
  <div class="control has-icons-left">
    <div class="select is-success">
      <select bind:value={selTchr_ID}>
        <option value="null" selected disabled>Выберите преподавателя</option>

        {#each tchrjs.filter((t) => t.Depart_ID == selDep_ID) as item, i}
          <option value={item.Emp_ID}>
            {item.FIO}
          </option>
        {/each}
      </select>
    </div>
    <span class="icon is-medium is-left">
      <!-- <i class="fas fa-chalkboard-teacher" /> -->
      <i class="fas fa-diagnoses" />
    </span>
  </div>
</div>

<style>
  .select {
    width: 250px;
  }

  .dep_select {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
</style>
