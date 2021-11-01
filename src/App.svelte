<script lang="ts">
  import Login from "./pages/Login.svelte";
  import Todos from "./pages/Todos.svelte";
  import { user } from "./stores/user-data";
  import Modal from "svelte-simple-modal";

  const fetchProfile = user.refresh();
</script>

<Modal>
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
