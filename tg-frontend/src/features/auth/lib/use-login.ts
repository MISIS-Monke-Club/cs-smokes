import { useMutation } from "@tanstack/react-query"
import { api } from "../api"

export function useLogin() {
    const { mutateAsync } = useMutation({
        mutationFn: api.loginTg,
    })

    return mutateAsync
}
