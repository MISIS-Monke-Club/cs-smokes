import { z } from "zod"

export type LoginTgModel = {
    userId: number
    token: string
}
export const loginTgDTOschema = z.object({
    User_ID: z.coerce.number(),
    token: z.string(),
})

export type LoginTgPostModel = {
    initData: string
}
