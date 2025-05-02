import { Store } from "@reduxjs/toolkit"
import { selectAuthSession } from "@entities/session"
import { instance } from "@shared/api"

export const setupInterceptors = (store: Store) => {
    instance.interceptors.request.use((config) => {
        const { accessToken } = selectAuthSession(store.getState())

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }

        return config
    })
}
