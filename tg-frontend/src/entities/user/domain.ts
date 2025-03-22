import { z } from "zod"

export const userDTOShema = z.object({
    user_id: z.number().int(),
    username: z.string(),
    avatar_url: z.string().url(),
    steam_link: z.string().url(),
    tg_id: z.number().int(),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    is_banned: z.boolean(),
})

export type UserModel = z.infer<typeof userDTOShema>
