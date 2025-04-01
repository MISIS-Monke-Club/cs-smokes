import { useState } from "react"
import { Link } from "react-router-dom"
import classes from "./edit-profile-form.module.scss"
import { Button } from "@shared/ui/button/button"
import { Input } from "@shared/ui/input"

type EditProfileFormProps = {
    user: {
        username: string
        email: string
        first_name?: string
        last_name?: string
        steam_link?: string
    }
    onSubmit: (formData: FormData) => void
}

export function EditProfileForm({ user, onSubmit }: EditProfileFormProps) {
    const [isEditing, setIsEditing] = useState(false)

    const handleEditClick = () => {
        setIsEditing(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget as HTMLFormElement)
        onSubmit(formData)
    }

    return (
        <div>
            <form onSubmit={handleSubmit} className={classes.form}>
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='username'
                    defaultValue={user.username}
                    placeholder='Username'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='steam_link'
                    defaultValue={user.steam_link}
                    placeholder='Steam Link'
                />
                <Input
                    disabled={!isEditing}
                    type='email'
                    name='email'
                    defaultValue={user.email}
                    placeholder='Email'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='first_name'
                    defaultValue={user.first_name}
                    placeholder='First Name'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='last_name'
                    defaultValue={user.last_name}
                    placeholder='Last Name'
                />

                <div className={classes.buttons}>
                    {!isEditing ? (
                        <Button size='lg' onClick={handleEditClick}>
                            Начать редактировать
                        </Button>
                    ) : (
                        <Button size='lg'>
                            <Link to='/profile'>Отмена</Link>
                        </Button>
                    )}
                    <Button size='lg' type='submit' disabled={!isEditing}>
                        Сохранить
                    </Button>
                </div>
            </form>
        </div>
    )
}
