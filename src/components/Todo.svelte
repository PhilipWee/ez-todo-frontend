<script lang="ts">
  import { user, Workspace } from "../stores/user-data";
  import { customFetch } from "../utils/custom-fetch";

  export let todoData: {
    id: number;
    summary: string;
    desc: string;
    priority: "low" | "med" | "high";
    creator: string;
    assignees?: Array<string>;
    workspace: Workspace;
    deadline: Date;
    completed: boolean;
  };

  let expandedView: boolean = false;

  const onDelete = async () => {
    //TODO: Optimise this to not fetch full amount each time
    await customFetch.delete(`/todo/${todoData.id}`);
    await user.refresh();
  };

  const onUpdate = async (key, value) => {
    const result = await customFetch.patch(`/todo/${todoData.id}`, {
      [key]: value,
    });
  };
</script>

<div class="button container">
  <div class="item-1">
    <input type="checkbox" on:change={(e) => onUpdate("completed",e.target.checked)} checked={todoData.completed} />
  </div>
  <div class="item-10 container vertical">
    <div>
      <input
        on:change={(e) => onUpdate("summary", e.target.value)}
        value={todoData.summary}
      />
    </div>
    <div>
      <input on:change={(e) => onUpdate("desc", e.target.value)} value={todoData.desc} />
    </div>
    {#if expandedView}
      <div class="container">
        <div class="item-6">
          <p>Assignees</p>
          {#each todoData.assignees || [] as assignee}
            <p>{assignee}</p>
          {/each}
        </div>
        <div class="item-6">
          <p>Deadline</p>
          <p>Today la fak</p>
        </div>
      </div>
    {/if}
    <div>Workspace: {todoData.workspace.name}</div>
  </div>
  <div class="item-1">
    <select
      on:change={(e) => onUpdate("priority", e.target.value)}
      value={todoData.priority}
    >
      <option value="low">Low</option>
      <option value="med">Medium</option>
      <option value="high">High</option>
    </select>
  </div>
  <div class="item-1">
    <button on:click={onDelete}>Delete</button>
  </div>
</div>

<style lang="scss">
  @import "./common-styles";
</style>
