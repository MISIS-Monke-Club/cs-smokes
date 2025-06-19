import { Store } from "@reduxjs/toolkit"
import { setAccessToken } from "@entities/session"

export const setupSlice = (store: Store) => {
    const accessToken = localStorage.getItem("accessToken")

    if (accessToken) {
        store.dispatch(setAccessToken(accessToken))
    }
}
