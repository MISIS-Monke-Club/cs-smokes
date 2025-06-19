import { z } from "zod"
import { UserModel } from "@entities/user"

export const formSchema = z.object({
    username: z.string().min(1).optional(),
    email: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    steamLink: z.string().optional(),
})

export type UserPatchModel = Omit<Partial<UserModel>, "user_id">

export type PatchUserByIdParams = {
    userId: number
    userData: UserPatchModel
}

export const mapToApiKeys = (data: Partial<UserModel>) => ({
    username: data.username,
    steam_link: data.steamLink,
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
})
