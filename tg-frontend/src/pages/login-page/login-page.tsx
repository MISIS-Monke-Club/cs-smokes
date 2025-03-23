import { FormEvent } from "react"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import classes from "./login-page.module.scss"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { sessionApi } from "@entities/session"

export function LoginPage() {
    const { mutateAsync } = useMutation(sessionApi.loginTg())

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

        mutateAsync({ initData: formValues.login })
            .then(() => {
                toast.success("Данные успешно отправлены на /login/tg")
            })
            .catch((err) => {
                console.error(err)
                toast.error("Произошла ошибка отправки данных")
            })
    }

    return (
        <div className={classes.loginPage}>
            <h2 className={classes.title}>Login page</h2>
            <form onSubmit={handleSubmit}>
                <Input name='login' defaultValue={Telegram.WebApp.initData} />
                <Button type='submit'>send initData</Button>
            </form>
        </div>
    )
}
