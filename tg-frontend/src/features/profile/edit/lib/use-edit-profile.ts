import { useMutation, useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useQueryClient } from "@tanstack/react-query"
import { formSchema } from "../model"
import { api } from "../api"
import { mapToApiKeys } from "../model"
import { selectUserId } from "@entities/session"
import { userApi } from "@entities/user"
import { patchChecker } from "@shared/lib/patch-checker"
import { handleAxiosError } from "@shared/lib/handle-axios-error"

export function useEditProfile() {
    const navigate = useNavigate()
    const userId = useSelector(selectUserId)
    const queryClient = useQueryClient()

    const { data: profileData } = useQuery({
        ...userApi.getUserById(userId!),
        enabled: Boolean(userId),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: api.patchUserById,
        mutationKey: ["update-profile", "byId", userId],
    })

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!userId) {
            toast.error("Please login before editing your profile.")
            return
        }

        const formData = new FormData(e.currentTarget)
        const formValues = Object.fromEntries(formData) as Record<
            string,
            string
        >

        const { isChanged, modifiedData } = patchChecker({
            originValue: profileData,
            changedValue: formValues,
            modifyData: true,
        })

        if (!isChanged || !modifiedData) {
            toast.error("You haven’t changed anything.")
            return
        }

        const apiReadyData = mapToApiKeys(modifiedData)
        const parsed = formSchema.safeParse(apiReadyData)

        if (!parsed.success) {
            console.error(parsed.error)
            toast.error(`Ошибка валидации: ${parsed.error.message}`)
            return
        }

        try {
            await mutateAsync({
                userId,
                userData: apiReadyData,
            })

            queryClient.invalidateQueries({
                queryKey: userApi.getUserById(userId).queryKey,
            })

            toast.success("Profile updated successfully!")
            navigate("/profile")
        } catch (err) {
            const parsedError = handleAxiosError(err)
            console.error(parsedError)
            toast.error(parsedError.message)
        }
    }

    return {
        loggedUserId: userId,
        handleUpdate,
        profileData,
        isMutationPending: isPending,
    }
}
