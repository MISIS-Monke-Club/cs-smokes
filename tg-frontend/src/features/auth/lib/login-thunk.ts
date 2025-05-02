import { MutationObserver } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"
import { api } from "../api"
import { setAuthSession, setAuthorizeError } from "@entities/session"
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
                dispatch(
                    setAuthSession({
                        accessToken: loginResult.accessToken,
                        refreshToken: loginResult.refreshToken,
                        userId: loginResult.user.userId,
                    })
                )
                localStorage.setItem("accessToken", loginResult.accessToken)
            } else {
                console.error("unexpected result of request")
                dispatch(
                    setAuthorizeError({
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
