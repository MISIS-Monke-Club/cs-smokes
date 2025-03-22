import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type UserState = {
    userId?: number
}

const initialState: UserState = {
    userId: undefined,
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserId: (state, action: PayloadAction<number | undefined>) => {
            state.userId = action.payload
        },
    },
})

export const { setUserId } = userSlice.actions
export const userReducer = userSlice.reducer
