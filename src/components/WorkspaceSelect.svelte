<script lang="ts">
  import { user, workspace, Workspace } from "../stores/user-data";
  import { parse } from "../utils/parse-form-data";
  import { customFetch } from "../utils/custom-fetch";

  const updateWorkspace = async (data) => {
    const result = await customFetch.patch(`/workspace/${data.id || $workspace.id}`, data);
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
  };

  const deleteWorkspace = async (id: number) => {
    //TODO: Error handling
    //TODO: Fix bugs with creation and deletion
    const result = await customFetch.delete(`/workspace/${id}`);
    if (result.statusCode === 400) {
        alert("You can't delete a workspace until your todos are done! Finish your work, kid.")
        return
    }
    user.update((user) => {
      user.workspaces = user.workspaces.filter((workspace) => {
        if (workspace.id === id) {
          return false;
        }
        return true;
      });
      return user;
    });
  };
</script>

<div class="button">
  {#if $workspace !== null}
    <div>Current Workspace</div>
    <form on:submit|preventDefault={onSubmit}>
      <input name="name" value={$workspace.name} />
      <button type="submit" name="update">Update</button>
      <button type="submit" name="create">Create</button>
    </form>
    <div>All Workspaces</div>
    {#each $user.workspaces as userWorkspace}
      <button
        on:click={() => {
          workspace.set(userWorkspace);
        }}
      >
        {userWorkspace.name}
      </button>
      <button
        on:click={() => {
          deleteWorkspace(userWorkspace.id);
        }}
      >
        Delete
      </button>
      <br />
    {/each}
  {:else}
    <div>Loading</div>
  {/if}
</div>

<style lang="scss">
  @import "./common-styles";
</style>
