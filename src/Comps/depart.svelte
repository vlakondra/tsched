<script>
  import { onMount } from "svelte";

  export let checkDepartData;

  const esc = encodeURIComponent;
  const url = "https://old.ursei.su/Services/GetTeachersIniData?";
  const params = {
    //почему работает с любой датой?
    d: new Date().toISOString().slice(0, 10),
  };

  const query = Object.keys(params)
    .map((k) => `${esc(k)}=${esc(params[k])}`)
    .join("&");

  let depjs;
  let tchrjs;
  let selDep_ID;
  let selTchr_ID;

  onMount(async () => {
    //try ??
    let result = {};
    try {
      const res = await fetch(url + query);
      const jsres = await res.json();

      depjs = jsres["Departs"];
      tchrjs = jsres["Teachers"];

      result.reqfinished = depjs.length && tchrjs.length ? true : false;
      result.iserror = false;
    } catch (error) {
      console.error("Ошибка:", error);
      result.reqfinished = false;
      result.iserror = true;
    } finally {
      checkDepartData(result);
    }
  });

  const onDepSelected = (e) => {
    selTchr_ID = "null"; //Установим преп-ля в placeholder
  };
</script>

<div
  style="display: flex;flex-direction:row; align-items: center;justify-content: center; margin-left: 20px;"
>
  <div style="padding-right: 5px;width:120px;">Кафедра</div>

  <div class="dep_select">
    <!-- <div class="control"> -->
    <div class="select is-success">
      <select
        bind:value={selDep_ID}
        on:change={(v) => onDepSelected(v)}
        on:blur={undefined}
      >
        <option value="null" selected disabled>Выберите кафедру</option>
        {#if depjs}
          {#each depjs as item}
            <option value={item.Depart_ID}>
              {item.DepartName}
            </option>
          {/each}
        {/if}
      </select>
    </div>
    <!-- <span class="icon is-medium is-left">
        <i class="fas fa-sitemap" />
        <!-- <i class="fas fa-chalkboard-teacher" />
      <i class="fas fa-diagnoses" /> -->
    <!-- </span> -->
    <!-- </div> -->
  </div>
</div>
{selDep_ID}-{selTchr_ID}

<div
  style="display: flex;flex-direction:row; align-items: center; justify-content: center; margin-left: 20px;"
>
  <div style="padding-right: 5px;width:120px;">Преподаватель</div>

  <div class="dep_select">
    <!-- <div class="control has-icons-left2"> -->
    <div class="select is-success2">
      <select bind:value={selTchr_ID}>
        <option value="null" selected disabled>Выберите преподавателя</option>
        {#if tchrjs}
          {#each tchrjs.filter((t) => t.Depart_ID == selDep_ID) as item}
            <option value={item.Emp_ID}>
              {item.FIO}
            </option>
          {/each}
        {/if}
      </select>
    </div>
    <!-- <span class="icon is-medium is-left">
        <i class="fas fa-chalkboard-teacher" />
        <!-- <i class="fas fa-diagnoses" /> -->
    <!-- </span> -->
    <!-- </div> -->
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
