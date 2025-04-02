import classes from "./edit-profile-page.module.scss"
import { GoBack } from "@features/go-back"
import { EditProfileForm } from "@features/edit-profile"

export function EditProfilePage() {
    return (
        <div className={classes.wrapper}>
            <GoBack>Назад</GoBack>
            <h1 className={classes.title}>Редактирование профиля</h1>
            <EditProfileForm />
        </div>
    )
}
