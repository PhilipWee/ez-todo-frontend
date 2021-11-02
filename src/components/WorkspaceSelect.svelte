<script lang="ts">
  import { getContext } from "svelte";
  import { user, workspace, Workspace } from "../stores/user-data";
  import { customFetch } from "../utils/custom-fetch";
  import Clipboard from "./assets/Clipboard.svelte";
  import WorkspaceUpdater from "./WorkspaceUpdater.svelte";

  const { open } = getContext("simple-modal");

  const openUpdateDialog = () => {
    open(WorkspaceUpdater, { mode: "update" });
  };

  const openCreateDialog = () => {
    open(WorkspaceUpdater, { mode: "create" });
  };

  const deleteWorkspace = async (id: number) => {
    //TODO: Error handling
    //TODO: Fix bugs with creation and deletion
    const result = await customFetch.delete(`/workspace/${id}`);
    if (result.statusCode === 400) {
      alert(
        "You can't delete a workspace until your todos are deleted! Finish your work, kid."
      );
      return;
    }
    await user.refresh();
  };

  const copyTextToClipboard = async (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const setWorkspace = (workspaceId: number) => {
    const curWorkspace = $user.workspaces.find((userWorkspace) => {
      return String(userWorkspace.id) === String(workspaceId);
    });
    workspace.set(curWorkspace);
  };
</script>

<div>
  {#if $user !== null}
    
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
    <div class="pt-1 flex-h">
      <select class="grow" on:change={(e) => setWorkspace(e.target["value"])}>
        {#each $user.workspaces as userWorkspace}
          <option value={userWorkspace.id}>{userWorkspace.name}</option>
        {/each}
      </select>
    </div>
    <div class="pt-1 flex-h">
      <button class="mr-1" name="update" on:click={openUpdateDialog}
        >Update</button
      >
      <button class="mr-1" name="create" on:click={openCreateDialog}
        >Create</button
      >
      <button
        on:click={() => {
          deleteWorkspace($workspace.id);
        }}
      >
        Delete
      </button>
    </div>
  {:else}
    <div>Loading</div>
  {/if}
</div>

<style lang="scss">
  @import "../theme/default.scss";

  .grow {
    flex-grow: 1;
  }

  .flex-h {
    display: flex;
    flex-direction: row;
  }

  .pr-1 {
    padding-right: 1em;
  }

  .mr-1 {
    margin-right: 1em;
  }

  .pt-1 {
    padding-top: 1em;
  }

  
</style>
