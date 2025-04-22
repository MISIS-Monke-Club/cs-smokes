import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { grenadesMaper } from "../lib/grenade-maper"
import { GrenadesListMaper } from "./domain"

type State = {
    grenadesLists: Record<string, GrenadeListState>
}

type GrenadeListState = {
    mapFunction: GrenadesListMaper
}

const initialState: State = {
    grenadesLists: {
        allGrenades: { mapFunction: grenadesMaper },
    },
}

export const slice = createSlice({
    name: "grenades-lists",
    initialState,
    reducers: {
        createList: (
            state,
            action: PayloadAction<{
                listId: string
                mapFunction: GrenadesListMaper
            }>
        ) => {
            const { listId, mapFunction } = action.payload

            state.grenadesLists[listId] = {
                mapFunction,
            }
        },
        deleteListById: (state, action: PayloadAction<{ listId: string }>) => {
            const { listId } = action.payload

            delete state.grenadesLists[listId]
        },
        setMapFunctionForGrenadeList: (
            state,
            action: PayloadAction<{
                listId: string
                mapFunction: GrenadesListMaper
            }>
        ) => {
            const { listId, mapFunction } = action.payload

            state.grenadesLists[listId].mapFunction = mapFunction
        },
    },
    selectors: {
        selectGrenadeLists: (sliceState) => sliceState.grenadesLists,
    },
})

export const { createList, deleteListById, setMapFunctionForGrenadeList } =
    slice.actions
export const { selectGrenadeLists } = slice.selectors
