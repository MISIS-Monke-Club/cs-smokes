import { createSlice, PayloadAction } from "@reduxjs/toolkit"
type UserState = {
    userId: number | null
}

const initialState: UserState = {
    userId: null,
}

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserId: (state, action: PayloadAction<number>) => {
            state.userId = action.payload
        },
    },
    selectors: {
        selectUserId: (sliceState) => sliceState.userId,
    },
})

export const { setUserId } = userSlice.actions
export const userReducer = userSlice.reducer
export const { selectUserId } = userSlice.selectors
