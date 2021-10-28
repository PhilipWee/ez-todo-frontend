<script lang="ts">
  import Login from "./pages/Login.svelte";
  import Todos from "./pages/Todos.svelte";
  import { getEnv } from "./stores/setup-env";
  import { user, workspace } from "./stores/user-data";

  import { customFetch } from "./utils/custom-fetch";

  const fetchProfile = user.refresh()
</script>

<div class="outer-container">
  <div class="max-width-lg">
    {#await fetchProfile}
      <div>Loading...</div>
    {:then}
      {#if $user}
        <Todos />
      {:else}
        <Login />
      {/if}
    {:catch err}
      <div>{String(err)}</div>
    {/await}
  </div>
</div>

<style>
  .outer-container {
    display: grid;
    place-items: center;
  }

  .max-width-lg {
    height: 100vh;
    width: 100%;
    max-width: 1080px;
    background-color: antiquewhite;
  }
</style>
