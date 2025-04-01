import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { userApi } from "@entities/user"
import { selectUserId } from "@entities/session"

const profileSchema = z.object({
    username: z.string().min(1),
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    steam_link: z.string().url().optional(),
})

export function useEditProfile() {
    const userId = useSelector(selectUserId)
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: user, isLoading } = useQuery(userApi.getUserById(userId))

    const updateUserMutation = useMutation({
        mutationKey: [userApi.baseKey, "update"],
        mutationFn: async (formData: FormData) => {
            if (!user) throw new Error("User is not loaded")

            const formObject = Object.fromEntries(formData.entries())
            const validatedData = profileSchema.parse(formObject)
            return userApi.updateUser({
                userId: user.user_id,
                ...validatedData,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [userApi.baseKey, "profile"],
            })
            navigate("/profile")
        },
    })

    return { user, isLoading, updateUser: updateUserMutation.mutate }
}
