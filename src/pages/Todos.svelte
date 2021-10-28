<script lang="ts">
  import Todo from "../components/Todo.svelte";
  import Button from "../components/Button.svelte";
  import WorkspaceSelect from '../components/WorkspaceSelect.svelte'

  import { getEnv } from "../stores/setup-env";
  import { user, userTodos, workspace } from "../stores/user-data";

  import { customFetch } from "../utils/custom-fetch";

  let ENV = getEnv();

  const newTask = async () => {
    //TODO: Don't get the whole response each time
    const response = await customFetch.post(`todo`, {
      creatorId: $user.id,
      workspaceId: $workspace.id,
    });
    await user.refresh()
  };

  const logout = () => {
    window.location.href = `${ENV.BACKEND_URL}/user/auth/google/logout`;
  };

  const addToWorkspaceAlert = () => {
    const userId = prompt("Friend ID")
    addToWorkspace(userId, $workspace.id)
  }

  const addToWorkspace = async (userId: number|string, workspaceId?: number) => {
    const result = await customFetch.post(`/workspace/${workspaceId}/add-user/${userId}`)
    console.log(result)
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
    <WorkspaceSelect/>
    <Button text="New Task" onClick={newTask} />
    <Button text="Add Friend To Workspace" onClick={addToWorkspaceAlert} />
    <Button text="Filter" onClick={() => {}} />
    <Button text="Logout" onClick={logout} />
  </div>
</div>

<style>
  .container {
    display: flex;
    /* flex-direction: row; */
  }

  .col1 {
    flex-grow: 3;
  }

  .col2 {
    flex-grow: 1;
  }
</style>
