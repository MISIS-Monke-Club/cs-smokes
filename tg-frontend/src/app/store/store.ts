import { configureStore } from "@reduxjs/toolkit"
import { reducer } from "./reducer"

export const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = any
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
