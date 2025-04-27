import {
    asyncThunkCreator,
    buildCreateSlice,
    combineSlices,
    configureStore,
    createAsyncThunk,
    createSelector,
    ThunkAction,
    UnknownAction,
} from "@reduxjs/toolkit"
import { useSelector, useDispatch, useStore } from "react-redux"

export const rootReducer = combineSlices()

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(),
})

export type AppState = any
export type AppDispatch = typeof store.dispatch
export type AppThunk<R = void> = ThunkAction<
    R,
    AppState,
    unknown,
    UnknownAction
>

export const useAppSelector = useSelector.withTypes<AppState>()
export const useAppDispath = useDispatch.withTypes<AppDispatch>()
export const useAppStore = useStore.withTypes<typeof store>()
export const createAppSelector = createSelector.withTypes<AppState>()
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
    state: AppState
    dispatch: AppDispatch
}>()

export const createSlice = buildCreateSlice({
    creators: { asyncThunk: asyncThunkCreator },
})
