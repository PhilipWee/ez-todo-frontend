<script lang="ts">
  export let onClick: (e) => any
  export let text: string;
</script>

<div class="button" on:click={onClick}>{text}</div>

<style lang="scss">
  @import "./common-styles";
</style>
