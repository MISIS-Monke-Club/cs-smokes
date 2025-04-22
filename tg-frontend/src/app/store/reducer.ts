import { combineSlices } from "@reduxjs/toolkit"
import { userSlice } from "@entities/session"
import { grenadeSlice } from "@entities/grenade"

export const reducer = combineSlices(userSlice, grenadeSlice)
