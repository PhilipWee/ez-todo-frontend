<script lang="ts">
  import WorkspaceSelect from "../components/WorkspaceSelect.svelte";
  import { getEnv } from "../stores/setup-env";
  import { user, userTodos, workspace } from "../stores/user-data";
  import { customFetch } from "../utils/custom-fetch";
  import SideBarButton from "../components/SideBarButton.svelte";
  import Todo from "../components/Todo.svelte";
  import NewTask from "../components/assets/NewTask.svelte";
  import AddFriend from "../components/assets/AddFriend.svelte";
  import Filter from "../components/assets/Filter.svelte";
  import Logout from "../components/assets/Logout.svelte";

  let ENV = getEnv();

  const newTask = async () => {
    //TODO: Don't get the whole response each time
    const response = await customFetch.post(`todo`, {
      creatorId: $user.id,
      workspaceId: $workspace.id,
    });
    await user.refresh();
  };

  const logout = () => {
    window.location.href = `${ENV.BACKEND_URL}/user/auth/google/logout`;
  };

  const addToWorkspaceAlert = () => {
    const userId = prompt("Friend ID");
    addToWorkspace(userId, $workspace.id);
  };

  const addToWorkspace = async (
    userId: number | string,
    workspaceId?: number
  ) => {
    const result = await customFetch.post(
      `/workspace/${workspaceId}/add-user/${userId}`
    );
    console.log(result);
  };

  const initWorkspace = (async () => {
    if ($user.workspaces.length === 0) {
      user.newWorkspace();
    } else {
      workspace.set($user.workspaces[0]);
    }
  })();
</script>

{#await initWorkspace}
  <div>Loading Workspace</div>
{/await}

<div class="container">
  <div class="col1">
    {#each $userTodos as todo}
      <Todo todoData={todo} />
    {/each}
  </div>
  <div class="col2">
    <!-- <SideBarButton>
      <WorkspaceSelect slot="contents" />
    </SideBarButton> -->

    <!-- TODO: Make spacing a little less weird -->
    <SideBarButton onClick={newTask}>
      <NewTask slot="logo" />
      <div slot="contents">New Task</div>
    </SideBarButton>
    <SideBarButton onClick={addToWorkspaceAlert}>
      <AddFriend slot="logo" />
      <div slot="contents">Invite Friend</div>
    </SideBarButton>
    <SideBarButton>
      <Filter slot="logo" />
      <div slot="contents">Filter</div>
    </SideBarButton>
    <SideBarButton onClick={logout}>
      <Logout slot="logo" />
      <div slot="contents">Logout</div>
    </SideBarButton>
  </div>
</div>

<style lang="scss">
  @import "../theme/default.scss";

  .container {
    display: flex;
  }

  .col1 {
    flex-grow: 1;
    overflow-y: scroll;
    max-height: 90vh;
    margin-right: 1em;
  }

  .col2 {
    width: 5em;
    display: flex;
    align-items: end;
    flex-direction: column;
  }

  @media only screen and (min-width: $small-bp) {
    .col2 {
      width: 20em;
    }
  }
</style>
