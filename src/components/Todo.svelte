<script lang="ts">
  import { user, Workspace } from "../stores/user-data";
  import { customFetch } from "../utils/custom-fetch";
  import Tick from "./assets/Tick.svelte";

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

<div class="parent">
  <input
    class="hidden"
    id={`completed-${todoData.id}`}
    type="checkbox"
    on:change={(e) => onUpdate("completed", e.target["checked"])}
    checked={todoData.completed}
  />
  <label for={`completed-${todoData.id}`} class="checkbox-container padded">
    <Tick />
  </label>
  <div class="padded">
    <div class=" vertical">
      <input
        type="text"
        on:change={(e) => onUpdate("summary", e.target["value"])}
        value={todoData.summary}
        placeholder="Task Name"
      />
      <div>
        <input
          on:change={(e) => onUpdate("desc", e.target["value"])}
          value={todoData.desc}
        />
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
        on:change={(e) => onUpdate("priority", e.target["value"])}
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
</div>

<style lang="scss">
  @import "../theme/default";

  $radius: 15px;
  $border-width: 2px;
  $transition-time: 0.5s;

  

  .hidden {
    display: none;
  }

  .padded {
    padding: 20px;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
    background: rgb(104, 110, 110);
    transition: $transition-time;
    border-radius: $radius - $border-width 0 0 $radius - $border-width;
  }

  [type="checkbox"]:checked + label {
    background: #238823;
    transition: $transition-time;
  }

  .parent {
    display: flex;
    background: $bright-gray;
    margin: 10px;
    // padding: 20px;
    border-radius: $radius;
    border-color: rgb(104, 110, 110);
    border-style: solid;
    border-width: $border-width;
  }
</style>
