import { FormEvent } from "react"
import classes from "./login-page.module.scss"
import { z } from "zod"
import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { useMutation } from "@tanstack/react-query"
import { sessionApi } from "@entities/session"

export function LoginPage() {
    const { mutate } = useMutation(sessionApi.loginTg())

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

        mutate({ initData: formValues.login })
    }

    return (
        <div className={classes.loginPage}>
            <h2 className={classes.title}>Login page</h2>
            <form onSubmit={handleSubmit}>
                <Input name='login' defaultValue={Telegram.WebApp.initData} />
                <Button>send initData</Button>
            </form>
        </div>
    )
}
