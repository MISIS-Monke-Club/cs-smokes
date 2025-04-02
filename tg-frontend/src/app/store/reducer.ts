import { combineSlices } from "@reduxjs/toolkit"
import { userSlice } from "@entities/session"

export const reducer = combineSlices(userSlice)
