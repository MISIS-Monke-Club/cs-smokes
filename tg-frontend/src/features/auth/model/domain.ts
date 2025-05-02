import { z } from "zod"
import { userDTOschema, UserModel } from "@entities/user"

export type LoginTgModel = {
    user: UserModel
    accessToken: string
    refreshToken: string
}
export const loginTgDTOschema = z.object({
    user: userDTOschema,
    refresh_token: z.string().nonempty(),
    access_token: z.string().nonempty(),
})

export const loginTgErrorDTO = z.object({
    error: z.string().nonempty(),
})
