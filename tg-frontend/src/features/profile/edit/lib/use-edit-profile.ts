import { useMutation, useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { formSchema, PatchUserByIdParams } from "../model"
import { api } from "../api"
import { selectUserId } from "@entities/session"
import { userApi } from "@entities/user"
import { patchChecker } from "@shared/lib/patch-checker"
import { handleAxiosError } from "@shared/lib/handle-axios-error"

export function useEditProfile() {
    const navigate = useNavigate()
    const userId = useSelector(selectUserId)
    const { data: profileData } = useQuery({
        ...userApi.getUserById(userId!),
        enabled: Boolean(userId),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: api.patchUserById,
        mutationKey: ["update-profile", "byId", userId],
    })

    const updateUser = async (user: PatchUserByIdParams) => {
        if (!userId) {
            toast.error("cant update profile, looks like you are unauthorized")
        } else {
            await mutateAsync(user)

            toast.success("Updated profile data!")
        }
    }

    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (userId) {
            const formData = new FormData(e.currentTarget)
            const formValues = Object.fromEntries(formData)

            // Getting only changed fields
            const { isChanged, modifiedData } = patchChecker({
                originValue: profileData,
                changedValue: formValues,
                modifyData: true,
            })

            if (!isChanged) {
                toast.error(
                    "You haven`t changed anything, try to insert smt in text fields"
                )
            } else {
                const parsedData = formSchema.safeParse({ ...modifiedData })

                if (parsedData.success) {
                    // Updating user data on server only
                    // if something had been changed
                    updateUser({
                        userId,
                        // Using spread operator to include in request
                        // ONLY changed fields
                        userData: { ...modifiedData },
                    })
                        .then(() => {
                            navigate("/profile")
                        })
                        .catch((err) => {
                            const parsedError = handleAxiosError(err)
                            console.error(parsedError)
                            toast.error(parsedError.message)
                        })
                }
                // Form validation gives error
                else {
                    toast.error(
                        `Ошибка ввода, сообщение: ${parsedData.error.message}`
                    )
                    console.error(parsedData.error)
                }
            }
        } else {
            console.error("cant edit profile, because you are unauthorized")
            toast.error("Please login before")
        }
    }

    return {
        loggedUserId: userId,
        handleUpdate,
        profileData,
        isMutationPending: isPending,
    }
}
