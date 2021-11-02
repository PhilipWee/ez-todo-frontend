import { readable, get } from "svelte/store";

//TODO: Think of a better way of storing environment variables
export const envStore = readable({
    // BACKEND_URL: "http://localhost:8000"
    BACKEND_URL: "https://ez-todo-backend.herokuapp.com"
})

export const getEnv = () => {
    return get(envStore)
}

export default envStore