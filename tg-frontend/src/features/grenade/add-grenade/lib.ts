import { useMutation } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { api } from "./api"
import { LineupFormData } from "./model"
import { selectUserId } from "@entities/session"

export function useAddLineup() {
    const navigate = useNavigate()
    const userId = useSelector(selectUserId)

    const { mutateAsync, isPending } = useMutation(api.createLineup())
    const addLineup = async (form: LineupFormData) => {
        if (!userId) {
            toast.error("Вы не авторизованы.")
            throw new Error("Пользователь не авторизован")
        }

        try {
            await mutateAsync({
                data: form,
                userId,
            })
            toast.success("Лайнап добавлен успешно!")
            navigate("/grenades")
        } catch (err) {
            console.error(err)
            toast.error("Ошибка при добавлении лайнапа.")
        }
    }

    return {
        addLineup,
        isLoading: isPending,
    }
}
