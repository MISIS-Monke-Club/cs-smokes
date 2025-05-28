import { FormEvent } from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { AddLineupModel, lineupSchema } from "../model"
import { useAddLineup } from "../lib"
import classes from "./add-lineup-form.module.scss"
import { Input } from "@shared/ui/input"
import { Textarea } from "@shared/ui/textarea"
import { Select } from "@shared/ui/select"
import { Button } from "@shared/ui/button"
import { mapApi } from "@entities/map"
import { grenadeClassApi } from "@entities/grenade-class"

type AddLineupFormProps = {
    name?: string
    className?: string
    initialValues?: AddLineupModel
}

export function AddLineupForm({ className }: AddLineupFormProps) {
    const {
        data: maps,
        isLoading: isMapsLoading,
        isError,
    } = useQuery(mapApi.getMapsOptions())
    const {
        data: grenadeClasses,
        isLoading: isGrenadeClassLoading,
        isError: isGrenadeClassError,
    } = useQuery(grenadeClassApi.getGrenadeClassOptions())
    const { addLineup, isLoading } = useAddLineup()

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            const formData = new FormData(e.currentTarget)
            const parsed = lineupSchema.parse(Object.fromEntries(formData))

            const previewImage = formData.get("preview_image_link")

            if (!(previewImage instanceof File) || previewImage.size === 0) {
                toast.error("Добавьте изображение превью.")
                return
            }

            addLineup({
                ...parsed,
                preview_image_link: previewImage,
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
                label='Name'
                type='text'
                placeholder='Enter lineup name'
                required
                name='title'
            />

            <Textarea
                withLabel
                label='Description'
                placeholder='Enter lineup description'
                required
                name='description'
            />

            <Select
                withLabel
                label='Map'
                name='map_id'
                required
                disabled={isMapsLoading || isError}
                options={
                    maps?.map((map) => ({
                        value: String(map.mapId),
                        label: map.name,
                    })) ?? []
                }
            />

            <Select
                withLabel
                label='Grenade class'
                name='grenade_class_id'
                required
                disabled={isGrenadeClassLoading || isGrenadeClassError}
                options={
                    grenadeClasses?.map((grenadeClasse) => ({
                        value: String(grenadeClasse.id),
                        label: grenadeClasse.name,
                    })) ?? []
                }
            />

            <Input
                withLabel
                label='Link to video (Rutube / YouTube)'
                type='text'
                placeholder='https://www.youtube.com/watch?v=...'
                required
                name='link_to_video'
            />

            <Input
                withLabel
                label='Preview Image'
                type='file'
                required
                name='preview_image_link'
            />

            <Button
                className={classes.button}
                type='submit'
                disabled={isLoading}
            >
                {isLoading ? "Adding..." : "Add lineup"}
            </Button>
        </form>
    )
}
