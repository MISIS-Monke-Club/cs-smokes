import classes from "./edit-profile-page.module.scss"
import { EditProfileForm } from "@widgets/edit-profile-form"
import { useEditProfile } from "@features/edit-profile"

export function EditProfilePage() {
    const { user, isLoading, updateUser } = useEditProfile()

    if (isLoading) {
        return <b>Loading...</b>
    }

    if (!user) {
        return <b>Профиль не найден</b>
    }

    return (
        <>
            <div className={classes.wrapper}>
                <h1 className={classes.title}>Редактирование профиля</h1>
                <EditProfileForm user={user} onSubmit={updateUser} />
            </div>
        </>
    )
}
