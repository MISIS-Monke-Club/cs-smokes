import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { rootReducer } from "@shared/model"

type UserState = {
    userId: number | null
    errorMessage: string | null
}

const initialState: UserState = {
    userId: null,
    errorMessage: null,
}

export const slice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserId: (state, action: PayloadAction<number>) => {
            state.errorMessage = null
            state.userId = action.payload
        },
        setUserError: (state, action: PayloadAction<{ message: string }>) => {
            const { message } = action.payload

            state.errorMessage = message
        },
        deleteUser: (state) => {
            state.userId = null
            state.errorMessage = null
        },
    },
    selectors: {
        selectUserId: (sliceState) => sliceState.userId,
        selectError: (sliceState) => sliceState.errorMessage,
    },
}).injectInto(rootReducer)

// Exports
export const { setUserId, deleteUser, setUserError } = slice.actions
export const { selectUserId, selectError } = slice.selectors
