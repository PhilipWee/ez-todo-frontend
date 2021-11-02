<script lang="ts">
  import { user, workspace, Workspace } from "../stores/user-data";
  import { customFetch } from "../utils/custom-fetch";
  import Tick from "./assets/Tick.svelte";
  import Expand from "./assets/Expand.svelte";
  import EditorJS from "@editorjs/editorjs";
  import List from "@editorjs/list";
  import CheckList from "@editorjs/checklist";
  import AddAssignee from "../components/assets/Add.svelte";
  import { getContext } from "svelte";
  import AssignTodoPopup from "./AssignTodoPopup.svelte";

  //URGENT TODO: Fix bug where leaving the page too early does not save content for editor JS
  //URGENT TODO: Somehow make typing the text confirm save the values
  //TODO: Make ctrl-s save

  export let todoData: {
    id: number;
    summary: string;
    desc: string;
    priority: "low" | "med" | "high";
    creator: string;
    assignees?: Array<any>;
    workspace: Workspace;
    deadline: Date;
    completed: boolean;
  };

  const { open } = getContext("simple-modal");

  const showAssignTodoPopup = () => {
    open(AssignTodoPopup, {
      workspaceId: todoData.workspace.id,
      assignees: todoData.assignees,
      todoId: todoData.id,
    });
  };

  let descriptionData = undefined;

  if (todoData.desc !== "") {
    try {
      descriptionData = JSON.parse(todoData.desc);
    } catch (e) {
      //Malformed data, we just don't render for now
      console.log("Malformed Data:", e);
    }
  }

  new EditorJS({
    holder: `editor-${todoData.id}`,
    tools: {
      list: List,
      checklist: CheckList,
    },
    onChange(api, block) {
      api.saver.save().then((data) => onUpdate("desc", JSON.stringify(data)));
    },
    data: descriptionData,
    //wtf typescript
    //@ts-ignore
    logLevel: "ERROR",
    placeholder: "Task Description",
    minHeight: 0
  });

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
  <div class="padded full-width">
    <div class="vertical">
      <div class="container">
        <input
          type="text"
          on:change={(e) => onUpdate("summary", e.target["value"])}
          value={todoData.summary}
          placeholder="Task Name"
          id="summary"
        />
        <div
          on:click={() => {
            expandedView = !expandedView;
          }}
        >
          <Expand />
        </div>
      </div>
      <div
        id={`editor-${todoData.id}`}
        class:editor={"editor"}
        class:expanded={expandedView}
      />
      <!-- {#if expandedView}
        <div class="container">
          <div class="item-6" />
          <div class="item-6">
            <p>Deadline</p>
            <p>Today la fak</p>
          </div>
        </div>
      {/if} -->
      <div class="container pt-1">
        <div class="bottom-text pr-1">{todoData.workspace.name}</div>
        <div class="container grow" on:click={showAssignTodoPopup}>
          {#each todoData.assignees || [] as assignee}
            <div class="pr-1">
              <img
                class="assignee-picture"
                alt={assignee.googleData.displayName}
                src={assignee.googleData.photos[0].value}
              />
            </div>
          {/each}
          <div class="pr-1">
            <AddAssignee height="1em" />
          </div>
        </div>
        <select
          class="mr-1"
          on:change={(e) => onUpdate("priority", e.target["value"])}
          value={todoData.priority}
        >
          <option value="low">Low Priority</option>
          <option value="med">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <div>
          <button on:click={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../theme/default";

  $radius: 15px;
  $border-width: 2px;
  $transition-time: 0.5s;

  .pt-1 {
    padding-top: 0.5em;
  }

  .mr-1 {
    margin-right: 0.5em;
  }

  .pr-1 {
    padding-right: 0.5em;
  }

  .hidden {
    display: none;
  }

  .padded {
    padding: 20px;
  }

  .full-width {
    width: 100%;
  }

  .container {
    display: flex;
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

  .scrollable {
    max-height: 60vh;
    overflow-y: "scroll";
  }

  .editor {
    overflow-y: scroll;
    // height: 2rem;
    font-size: medium;
    color: $off-white-dark;
    padding-right: 2rem;
    transition: 0.3s;
  }

  .expanded {
    // height: 200px;
    transition: 0.3s;
  }

  #summary {
    display: flex;
    flex-grow: 1;
  }

  #expand {
    display: flex;
  }

  .grow {
    flex-grow: 1;
  }

  .bottom-text {
    font-size: small;
    color: $off-white-dark;
  }

  .assignee-picture {
    border-radius: 20%;
    width: 1em;
    height: 1em;
  }
</style>
