import { FormEvent } from "react"
import { toast } from "sonner"
import { lineupSchema, mapOptions } from "../model"
import { useAddLineup } from "../lib"
import classes from "./add-lineup-form.module.scss"
import { Input } from "@shared/ui/input"
import { Button } from "@shared/ui/button"

export function AddLineupForm() {
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
        <form className={classes.form} onSubmit={handleSubmit}>
            <div className={classes.formGroup}>
                <label className={classes.label} htmlFor='title'>
                    Название лайнапа
                </label>
                <Input type='text' id='title' name='title' required />
            </div>

            <div className={classes.formGroup}>
                <label className={classes.label} htmlFor='description'>
                    Описание
                </label>
                <textarea
                    className={classes.textarea}
                    id='description'
                    name='description'
                    required
                ></textarea>
            </div>

            <div className={classes.formGroup}>
                <label className={classes.label} htmlFor='map'>
                    Карта
                </label>
                <select id='map' name='map' className={classes.select} required>
                    <option value='' disabled selected>
                        Выберите карту
                    </option>
                    {mapOptions.map((map) => (
                        <option key={map} value={map}>
                            {map}
                        </option>
                    ))}
                </select>
            </div>

            <div className={classes.formGroup}>
                <label className={classes.label} htmlFor='link_to_video'>
                    Ссылка на видео (YouTube / Rutube)
                </label>
                <Input
                    type='url'
                    id='link_to_video'
                    name='link_to_video'
                    placeholder='https://www.youtube.com/watch?v=...'
                    required
                />
            </div>

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
