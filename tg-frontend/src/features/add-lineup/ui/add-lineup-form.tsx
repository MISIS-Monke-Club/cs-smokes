import { FormEvent } from "react"
import { toast } from "sonner"
import { AddLineupModel, lineupSchema, mapOptions } from "../model"
import { useAddLineup } from "../lib"
import classes from "./add-lineup-form.module.scss"
import { Input } from "@shared/ui/inputNew"
import { Button } from "@shared/ui/button"

type AddLineupFormProps = {
    name?: string
    className?: string
    initialValues?: AddLineupModel
}

export function AddLineupForm({ className }: AddLineupFormProps) {
    const { addLineup, isLoading } = useAddLineup()

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            const formData = new FormData(e.currentTarget)
            const parsed = lineupSchema.parse(Object.fromEntries(formData))

            addLineup({
                ...parsed,
            })
        } catch (err) {
            console.error(err)
            toast.error("Проверьте правильность заполнения формы")
        }
    }

    return (
        <form
            className={`${classes.form} ${className ?? ""}`}
            onSubmit={handleSubmit}
            role='form'
        >
            <Input
                withLabel
                label='Название лайнапа'
                type='text'
                placeholder='Название лайнапа'
                required
            />

            <Input
                withLabel
                label='Описание'
                type='textarea'
                placeholder='Описание лайнапа'
                required
            />

            <Input
                withLabel
                label='Карта'
                type='select'
                options={mapOptions.map((map) => ({ value: map, label: map }))}
                placeholder='Описание лайнапа'
                required
            />

            <Input
                withLabel
                label='Ссылка на видео (YouTube / Rutube)'
                type='text'
                placeholder='https://www.youtube.com/watch?v=...'
                required
            />

            <Button
                className={classes.button}
                type='submit'
                disabled={isLoading}
            >
                {isLoading ? "Добавление..." : "Добавить лайнап"}
            </Button>
        </form>
    )
}
