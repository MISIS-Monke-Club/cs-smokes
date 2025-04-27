import { useState } from "react"
import { Link } from "react-router-dom"
import { useEditProfile } from "../lib/use-edit-profile"
import classes from "./form.module.scss"
import { Button } from "@shared/ui/button/button"
import { Input } from "@shared/ui/input"

export function EditProfileForm() {
    const { handleUpdate, profileData } = useEditProfile()
    const [isEditing, setIsEditing] = useState<boolean>(false)

    const handleEditClick = () => {
        setIsEditing(true)
    }

    return (
        <div>
            <form onSubmit={handleUpdate} className={classes.form}>
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='username'
                    defaultValue={profileData?.username || undefined}
                    placeholder='Your username...'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='steamLink'
                    defaultValue={profileData?.steamLink || undefined}
                    placeholder='Your steam link...'
                />
                <Input
                    disabled={!isEditing}
                    type='email'
                    name='email'
                    defaultValue={profileData?.email || undefined}
                    placeholder='Your email...'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='firstName'
                    defaultValue={profileData?.firstName || undefined}
                    placeholder='Your first name...'
                />
                <Input
                    disabled={!isEditing}
                    type='text'
                    name='lastName'
                    defaultValue={profileData?.lastName || undefined}
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
