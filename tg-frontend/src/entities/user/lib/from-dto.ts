import { z } from "zod"
import { userDTOschema, UserModel } from "../model/domain"

export const fromUserDTO = (dto: z.infer<typeof userDTOschema>): UserModel => ({
    userId: dto.user_id,
    username: dto.username,
    avatarUrl: dto.avatar_url,
    steamLink: dto.steam_link,
    tgId: dto.tg_id,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    isBanned: dto.is_banned,
})
