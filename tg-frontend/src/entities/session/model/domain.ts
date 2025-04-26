import { z } from "zod"

export type LoginTgModel = {
    userId: number
    authToken: string
    refreshToken: string
}
export const loginTgDTOschema = z.object({
    user_id: z.number(),
    refresh_token: z.string().nonempty(),
    auth_token: z.string().nonempty(),
})

export const loginTgErrorDTO = z.object({
    error: z.string().nonempty(),
})
