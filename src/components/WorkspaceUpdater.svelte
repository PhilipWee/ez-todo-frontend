<script lang="ts">
  import { user, workspace, Workspace } from "../stores/user-data";
  import { customFetch } from "../utils/custom-fetch";
  import { parse } from "../utils/parse-form-data";
  import { getContext } from "svelte";

  export let mode: "update" | "create";

  const { close } = getContext("simple-modal");

  const updateWorkspace = async (data) => {
    const result = await customFetch.patch(
      `/workspace/${data.id || $workspace.id}`,
      data
    );
    user.update((user) => {
      user.workspaces = user.workspaces.map((workspace) => {
        if (workspace.id === result.id) {
          workspace = result;
        }
        return workspace;
      });
      return user;
    });
  };

  const onSubmit = async (e) => {
    const data = parse<Workspace>(e);
    if (e.submitter.name === "update") {
      await updateWorkspace(data);
    } else if (e.submitter.name === "create") {
      const newWorkspace = await user.newWorkspace();
      newWorkspace.name = data.name;
      await updateWorkspace(newWorkspace);
    }
    close();
  };
</script>

<form on:submit|preventDefault={onSubmit}>
  <input type="text" name="name" value={$workspace.name} />
  {#if mode === "update"}
    <button type="submit" name="update">Update</button>
  {/if}
  {#if mode === "create"}
    <button type="submit" name="create">Create</button>
  {/if}
</form>

<style lang="scss">
  @import "../theme/default.scss";

  input[type="text"] {
    font-family: "Montserrat", sans-serif;
    color: $base-fg;
    background-color: $base-bg;
    border: 1px solid $base-fg;
    padding: 1em 0.5em 1em 0.5em;
    border-radius: $radius;
    transition: 0.3s;
  }
</style>
