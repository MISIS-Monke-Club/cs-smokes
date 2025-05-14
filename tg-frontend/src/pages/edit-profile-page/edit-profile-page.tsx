import classes from "./edit-profile-page.module.scss"
import { GoBack } from "@features/go-back"
import { EditProfileForm } from "@features/profile/edit"

export function EditProfilePage() {
    return (
        <div className={classes.wrapper}>
            <GoBack className={classes.back}>Назад</GoBack>
            <EditProfileForm />
        </div>
    )
}
