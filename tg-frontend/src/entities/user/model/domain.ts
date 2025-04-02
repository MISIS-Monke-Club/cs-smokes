import { z } from "zod"

export const userDTOschema = z.object({
    user_id: z.number().int(),
    username: z.string(),
    avatar_url: z.string().url().nullable(),
    steam_link: z.string().url().nullable(),
    tg_id: z.number().int().nullable(),
    email: z.string().email().nullable(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    is_banned: z.boolean(),
})

export type UserModel = {
    userId: number
    username: string
    avatarUrl: string | null
    steamLink: string | null
    tgId: number | null
    email: string | null
    firstName: string | null
    lastName: string | null
    isBanned: boolean
}
