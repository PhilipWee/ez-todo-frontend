<script>
  import { getEnv } from "../stores/setup-env";
  import Button from "../components/Button.svelte"

  let ENV = getEnv();

  const googleLogin = () => {
    window.location = `${ENV.BACKEND_URL}/user/auth/google/login`;
  };
</script>

<div class="centered-child">
  <div class="padded-center">
    <h1>Complete Tasks. Get Memes.</h1>
    <Button onClick={googleLogin}>
      Login with Google
    </Button>
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
