<script lang="ts">
  import { user, workspace, Workspace } from "../stores/user-data";
  import { parse } from "../utils/parse-form-data";
  import { customFetch } from "../utils/custom-fetch";
  import Clipboard from "./assets/Clipboard.svelte";

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
  };

  const deleteWorkspace = async (id: number) => {
    //TODO: Error handling
    //TODO: Fix bugs with creation and deletion
    const result = await customFetch.delete(`/workspace/${id}`);
    if (result.statusCode === 400) {
      alert(
        "You can't delete a workspace until your todos are done! Finish your work, kid."
      );
      return;
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

  const copyTextToClipboard = async (text: string) => {
    navigator.clipboard.writeText(text);
  };
</script>

<div>
  {#if $user !== null}
    <img
      class="profile-image"
      src={$user.googleData.photos[0].value}
      alt={$user.googleData.displayName}
    />
    <div>
      {$user.googleData.displayName}
    </div>
    <div
      class="flex-h"
      on:click={() => {
        copyTextToClipboard(String($user.id));
      }}
    >
      <div class="pr-1">
        User ID: {$user.id}
      </div>
      <Clipboard />
    </div>
    <br />
  {/if}
  {#if $workspace !== null}
    <div>Current Workspace</div>
    <form on:submit|preventDefault={onSubmit}>
      <input type="text" name="name" value={$workspace.name} />
      <button type="submit" name="update">Update</button>
      <button type="submit" name="create">Create</button>
    </form>
    <div>Current Workspace</div>
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
  // @import "../theme/default.scss"
  .flex-h {
    display: flex;
    flex-direction: row;
  }

  .pr-1 {
    padding-right: 1em;
  }

  .profile-image {
    height: 2em;
    width: 2em;
  }
</style>
