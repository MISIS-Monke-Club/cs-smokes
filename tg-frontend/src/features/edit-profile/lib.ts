import { useMutation } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { api } from "./api"
import { PatchUserByIdParams } from "./model"
import { selectUserId } from "@entities/session"

export function useEditProfile() {
    const navigate = useNavigate()
    const userId = useSelector(selectUserId)

    const { mutateAsync, isPending } = useMutation(api.patchUserById())

    const updateUser = (user: PatchUserByIdParams) => {
        if (!userId) {
            toast.error("cant update profile, looks like you are unauthorized")
        } else {
            mutateAsync(user)
                .then(() => {
                    navigate("/profile")

                    toast.success("Updated profile data!")
                })
                .catch((err) => {
                    console.error(err)
                    toast.error("Something went wrong, cant update profile")
                })
        }
    }

    return {
        loggedUserId: userId,
        updateUser,
        isMutationPending: isPending,
    }
}
