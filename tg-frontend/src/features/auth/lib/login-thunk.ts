import { MutationObserver } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"
import { api } from "../api"
import { setUserError, setUserId } from "@entities/session"
import { client } from "@shared/api"
import { TELEGRAM_INIT_DATA } from "@shared/config/constants"
import { AppThunk } from "@shared/model/store"
import { userApi, UserModel } from "@entities/user"

export const loginThunk = (): AppThunk => (dispatch, _) => {
    const mutationObserver = new MutationObserver(client, {
        mutationFn: () => api.loginTg({ init_data: TELEGRAM_INIT_DATA }),
    })
        .mutate()
        .then((loginResult) => {
            if (loginResult) {
                client.setQueryData<UserModel>(
                    userApi.getUserById(loginResult.user.userId).queryKey,
                    loginResult.user
                )
                dispatch(setUserId(loginResult.user.userId))
            } else {
                console.error("unexpected result of request")
                dispatch(
                    setUserError({
                        message: "something unexpected happened...",
                    })
                )
            }
        })
        .catch((err) => {
            if (err instanceof AxiosError) {
                toast.error("Login failed with error")
                console.error({
                    code: err.code,
                    message: err.message,
                    status: err.status,
                })
            } else {
                console.error(`Unknown error: ${err}`)
            }
        })

    return mutationObserver
}
