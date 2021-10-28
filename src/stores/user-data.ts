import { derived, writable, get } from "svelte/store"
import { getEnv } from "./setup-env";

import { customFetch } from '../utils/custom-fetch'

const ENV = getEnv()

export type Workspace = {
    id: number,
    name: string
}

export type User = {
    id: string | number,
    googleId: string,
    googleData: any,
    workspaces: Array<Workspace>
}

function createUserStore() {
    const { subscribe, set, update } = writable<User | null>(null)

    const refresh = async () => {
        const result = await customFetch.get(`/user/cur-user`);
        set(result.user);
        if (result.user === null) return
        if (result.user.workspaces.length === 0) return
        if (get(workspace) === null) {
            workspace.set(result.user.workspaces[0])
        }
    }

    return {
        subscribe,
        set,
        update,
        refresh,
        newWorkspace: async () => {
            const result = await customFetch.post(
                `/user/create-workspace`
            );
            await refresh()
            return result
        }
    }
}


export const user = createUserStore()

export const workspace = writable<Workspace | null>(null)

export const userTodos = derived(
    user,
    ($user, set) => {
        if ($user === null) {
            set([])
        } else {
            customFetch.get(`/user/todos`).then(todos => {
                set(todos)
            })
        }
    },
    []
);
