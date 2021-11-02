<script lang="ts">
  import customFetch from "../utils/custom-fetch";
  import { user } from "../stores/user-data";

  export let workspaceId: number;
  export let assignees: Array<any>;
  export let todoId: number;

  console.log(todoId);

  const isUserAssigned = (workspaceUser: any) => {
    return assignees.some((assignee) => assignee.id === workspaceUser.id);
  };

  const getWorkspaceUsers = async () => {
    const result = await customFetch.get(`/workspace/${workspaceId}/users`);
    console.log(result);
    return result.users;
  };

  const getDisplayName = (workspaceUser: any) => {
    return workspaceUser.googleData.displayName;
  };

  const getImageURL = (workspaceUser: any) => {
    return workspaceUser.googleData.photos[0].value;
  };

  const setUserAssigned = async (workspaceUser: any, assigned: boolean) => {
    const endpoint = `/todo/${todoId}/assign-to/${workspaceUser.id}`;

    const result = await customFetch.post(endpoint, {
      assigned,
    });

    await user.refresh();
  };
</script>

<h1>Assign Users</h1>

{#await getWorkspaceUsers()}
  <div>Loading Workspace Users</div>
{:then workspaceUsers}
  <div class="container">
    <div class="expand">Assignee</div>
    <div>Assigned</div>
  </div>
  {#each workspaceUsers as workspaceUser}
    <div class="container">
      <img
        class="image"
        src={getImageURL(workspaceUser)}
        alt={getDisplayName(workspaceUser)}
      />
      <div class="expand pl-1">
        <div>{getDisplayName(workspaceUser)}</div>
      </div>
      <input
        on:change={(e) => setUserAssigned(workspaceUser, e.target["checked"])}
        type="checkbox"
        checked={isUserAssigned(workspaceUser)}
      />
    </div>
  {/each}
{/await}

<style lang="scss">
  @import "../theme/default.scss";

  .container {
    display: flex;
    flex-direction: row;
  }

  .pl-1 {
    padding-left: 1em
  }

  .expand {
    flex-grow: 1;
  }

  .image {
    height: 1em;
    width: 1em;
  }
</style>
