import { z } from "zod"
import { UserModel } from "@entities/user"

export const formSchema = z.object({
    username: z.string().min(1),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    steamLink: z.string().url(),
})

export type UserPatchModel = Omit<Partial<UserModel>, "user_id">

export type PatchUserByIdParams = {
    userId: number | null
    userData: UserPatchModel
}
