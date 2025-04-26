import { useMutation } from "@tanstack/react-query"
import { sessionApi } from "@entities/session"

export function useLogin() {
    const { mutateAsync } = useMutation({
        mutationFn: sessionApi.loginTg,
    })

    return mutateAsync
}
