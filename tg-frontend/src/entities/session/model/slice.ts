import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { rootReducer } from "@shared/model"

type SessionSliceModel = {
    auth: AuthSession
    errorMessage: string | null
}

type AuthSession = {
    accessToken: AccessToken
    refreshToken: string | null
    userId: UserId
}

type UserId = number | null
type AccessToken = string | null

const initialState: SessionSliceModel = {
    errorMessage: null,
    auth: {
        accessToken: null,
        refreshToken: null,
        userId: null,
    },
}

export const slice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setAuthSession: (state, action: PayloadAction<AuthSession>) => {
            state.errorMessage = null
            state.auth = action.payload
        },
        setAccessToken: (state, action: PayloadAction<AccessToken>) => {
            state.auth.accessToken = action.payload
        },
        setAuthorizeError: (
            state,
            action: PayloadAction<{ message: string }>
        ) => {
            const { message } = action.payload

            state.errorMessage = message
        },
        deleteAuthSession: (state) => {
            state.auth = {
                accessToken: null,
                refreshToken: null,
                userId: null,
            }
            state.errorMessage = null
        },
    },
    selectors: {
        selectUserId: (sliceState) => sliceState.auth.userId,
        selectAuthSession: (sliceState) => sliceState.auth,
        selectError: (sliceState) => sliceState.errorMessage,
    },
}).injectInto(rootReducer)

// Exports
export const {
    deleteAuthSession,
    setAuthSession,
    setAuthorizeError,
    setAccessToken,
} = slice.actions
export const { selectUserId, selectError, selectAuthSession } = slice.selectors
