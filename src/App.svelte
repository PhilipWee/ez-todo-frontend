<script lang="ts">
  import Login from "./pages/Login.svelte";
  import Todos from "./pages/Todos.svelte";
  import { user } from "./stores/user-data";
  import Modal from "svelte-simple-modal";

  const fetchProfile = user.refresh();
</script>

<Modal 
styleWindow={{
  // border: '2px solid #00beff',
  // boxShadow: 'inset 0 0 0 2px white, 0 0 0 2px white',
  background: "rgb(58, 60, 65)"
}}
>
  <div class="outer-container">
    <div class="max-width-lg">
      {#await fetchProfile}
        <div />
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
</Modal>

<style lang="scss">
  @import "theme/default";

  .outer-container {
    display: grid;
    place-items: center;
    background-color: $off-black;
  }

  .max-width-lg {
    min-height: 100vh;
    width: 100%;
    max-width: 1080px;
    background-color: $dark;
  }
</style>
