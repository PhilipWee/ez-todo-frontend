<script lang='ts'>
  import { getEnv } from "../stores/setup-env";
  import Button from "../components/Button.svelte"

  let ENV = getEnv();

</script>

<div class="centered-child">
  <div class="padded-center">
    <h1>Complete Tasks. Get Memes.</h1>
    <a href={`${ENV.BACKEND_URL}/user/auth/google/login`}>
      <Button>
        Login with Google
      </Button>
    </a>
  </div>
</div>

<style lang="scss">
  @import "../theme/default";

  .padded-center {
    padding: 2rem;
  }

  .centered-child {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 80vh;
  }
</style>
