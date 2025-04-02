import { FormEvent, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../api"
import { useEditProfile } from "../lib"
import { formSchema } from "../model"
import classes from "./form.module.scss"
import { Button } from "@shared/ui/button/button"
import { Input } from "@shared/ui/input"
import { defaultUser, UserModel } from "@entities/user"

export function EditProfileForm() {
    const { loggedUserId, updateUser } = useEditProfile()
    const { data } = useQuery(api.getUserById(loggedUserId))
    const [isEditing, setIsEditing] = useState<boolean>(false)

    const serverData: UserModel = useMemo(() => {
        let draftValue: UserModel = defaultUser

        if (data) {
            draftValue = data
        }

        return draftValue
    }, [data])

    const handleEditClick = () => {
        setIsEditing(true)
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            const formData = new FormData(e.currentTarget)
            const parsedData = formSchema.parse(Object.fromEntries(formData))

            updateUser({ userId: loggedUserId, userData: { ...parsedData } })
        } catch (err) {
            console.error(err)
        }
    }

    if (!loggedUserId) {
        return (
            <div>
                looks like you are not authorized, try vising
                <Button asChild variant='link'>
                    <Link to='/profile'>this page</Link>
                </Button>
            </div>
        )
    }

    return (
        <div>
            <form onSubmit={handleSubmit} className={classes.form}>
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='username'
                    defaultValue={serverData?.username || ""}
                    placeholder='Your username...'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='steamLink'
                    defaultValue={serverData?.steam_link || ""}
                    placeholder='Your steam link...'
                />
                <Input
                    disabled={!isEditing}
                    type='email'
                    name='email'
                    defaultValue={serverData?.email || ""}
                    placeholder='Your email...'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='firstName'
                    defaultValue={serverData?.first_name || ""}
                    placeholder='Your first name...'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='lastName'
                    defaultValue={serverData?.last_name || ""}
                    placeholder='Your first name...'
                />
                <div className={classes.buttons}>
                    {!isEditing ? (
                        <Button size='lg' onClick={handleEditClick}>
                            Начать редактировать
                        </Button>
                    ) : (
                        <Button type='reset' size='lg' asChild>
                            <Link to='/profile'>Отмена</Link>
                        </Button>
                    )}
                    <Button type='submit' size='lg' disabled={!isEditing}>
                        Сохранить
                    </Button>
                </div>
            </form>
        </div>
    )
}
