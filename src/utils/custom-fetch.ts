import { getEnv } from "../stores/setup-env";

const BACKEND_URL = getEnv().BACKEND_URL

const completeURL = (pathname:string) => {
    return (new URL(pathname,BACKEND_URL)).href
}

export const customFetch = {
    get: (url: string, opts: RequestInit = {}) => {
        return fetch(completeURL(url),
            {
                ...opts,
                credentials: 'include'
            }).then(response => response.json())
    },
    post: (url: string, body: Object = {}, opts: RequestInit = {}) => {
        return fetch(completeURL(url),
            {
                ...opts,
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                credentials: 'include',
                body: JSON.stringify(body)
            }).then(response => response.json())
    },
    put: (url: string, body: Object = {}, opts: RequestInit = {}) => {
        return fetch(completeURL(url),
            {
                ...opts,
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                credentials: 'include',
                body: JSON.stringify(body)
            }).then(response => response.json())
    },
    patch: (url: string, body: Object = {}, opts: RequestInit = {}) => {
        return fetch(completeURL(url),
            {
                ...opts,
                method: "PATCH",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                credentials: 'include',
                body: JSON.stringify(body)
            }).then(response => response.json())
    },
    delete: (url: string, body: Object = {}, opts: RequestInit = {}) => {
        return fetch(completeURL(url),
            {
                ...opts,
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                credentials: 'include',
                body: JSON.stringify(body)
            }).then(response => response.json())
    }
}

export default customFetch
