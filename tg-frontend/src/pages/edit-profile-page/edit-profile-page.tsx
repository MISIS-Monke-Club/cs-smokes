import classes from "./edit-profile-page.module.scss"
import { EditProfileForm } from "@features/profile/edit"

export function EditProfilePage() {
    return (
        <div className={classes.wrapper}>
            <EditProfileForm />
        </div>
    )
}
