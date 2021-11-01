<script lang="ts">
  export let onClick: (e) => any = () => {};
  export let expanded: boolean = false;
</script>

<div class="sidebar" on:click={onClick}>
  <div class="inner">
    <slot name="logo" />
    <div class:contents={!expanded}>
      <slot name="contents" />
    </div>
  </div>
</div>

<style lang="scss">
  @import "../theme/default.scss";

  $sidebar-padding: 20px;

  .contents {
    display: none;
    white-space: nowrap;
    overflow-x: hidden;
  }

  .sidebar {
    background: $bright-gray;
    padding: $sidebar-padding;
    margin: 10px 0 10px 0;
    border-radius: 15px 0 0 15px;
    border-color: rgb(104, 110, 110);
    border-style: solid;
    border-width: 2px 0 2px 2px;
    width: calc(100% - 2 * $sidebar-padding);
    z-index: 1;
    transition: 0.1s;

    &:hover {
      background: darken($bright-gray, 5%);
      transition: 0.3s;

      @media (max-width: $small-bp) {
        width: 200px;
      }

      .contents {
        display: block;
        transition: 1s;
      }
    }

    &:active {
      background: darken($bright-gray, 15%);
      transition: 0.1s;
    }
  }

  .inner {
    align-items: center;
    flex-direction: row;
    display: flex;
  }
</style>
