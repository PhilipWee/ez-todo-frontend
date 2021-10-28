<script>
  import { getEnv } from "../stores/setup-env";

  let ENV = getEnv()

  const googleLogin = () => {
    window.location = `${ENV.BACKEND_URL}/user/auth/google/login`
  };
</script>

<div class="centered-child max-width-lg">
  <button on:click={googleLogin}>Login with Google</button>
</div>

<style>
  .centered-child {
    display: grid;
    place-items: center;
    height: 100%;
    width: 100%;
  }
</style>
