import { z } from "zod"
import { UserModel } from "@entities/user"

export const formSchema = z.object({
    username: z.string().min(1).optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    steamLink: z.string().url().optional(),
})

export type UserPatchModel = Omit<Partial<UserModel>, "user_id">

export type PatchUserByIdParams = {
    userId: number
    userData: UserPatchModel
}
