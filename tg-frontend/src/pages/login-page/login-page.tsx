import { FormEvent } from "react"
import { z } from "zod"
import { useDispatch, useSelector } from "react-redux"
import { AxiosError } from "axios"
import { toast } from "sonner"
import classes from "./login-page.module.scss"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { TELEGRAM_INIT_DATA } from "@shared/config/constants"
import { useLogin } from "@features/auth"
import {
    loginTgErrorDTO,
    selectError,
    setUserError,
    setUserId,
} from "@entities/session"

export function LoginPage() {
    const login = useLogin()
    const loginError = useSelector(selectError)
    const dispatch = useDispatch()

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        // Prevents page reload
        e.preventDefault()

        const formFieldsSchema = z.object({
            login: z.string(),
        })

        const formData = new FormData(e.target as HTMLFormElement)
        const formValues = formFieldsSchema.parse(
            Object.fromEntries(formData.entries())
        )

        login({ init_data: formValues.login })
            .then((data) => {
                dispatch(setUserId(data.userId))
            })
            .catch((err) => {
                if (err instanceof AxiosError) {
                    const {
                        success: parseSuccess,
                        data: parsedData,
                        error: parseError,
                    } = loginTgErrorDTO.safeParse(err.response?.data)

                    if (parseSuccess) {
                        console.error(err.message)
                        toast.error("Something went wrong in login")

                        // Displaying this message across all the app
                        dispatch(setUserError({ message: parsedData.error }))
                    } else {
                        console.error(
                            `Received unknown error content from server: ${parseError}`
                        )
                    }
                } else {
                    console.error(`Unknown error: ${err}`)
                }
            })
    }

    return (
        <div className={classes.loginPage}>
            <h2 className={classes.title}>Login page</h2>
            {loginError && (
                <div className='text-red-500 font-bold'>{loginError}</div>
            )}
            <form onSubmit={handleSubmit}>
                <Input name='login' defaultValue={TELEGRAM_INIT_DATA} />
                <Button type='submit'>send initData</Button>
            </form>
        </div>
    )
}
