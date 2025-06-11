import { Link } from "react-router-dom"
import { useEditProfile } from "../lib/use-edit-profile"
import classes from "./form.module.scss"
import { Button } from "@shared/ui/button/button"
import { Input } from "@shared/ui/input"

export function EditProfileForm() {
    const { handleUpdate, profileData } = useEditProfile()

    return (
        <div>
            <form
                onSubmit={(e) => void handleUpdate(e)}
                className={classes.form}
            >
                <Input
                    withLabel
                    label='Username'
                    labelClassName={classes.label}
                    type='text'
                    name='username'
                    defaultValue={profileData?.username || undefined}
                    placeholder='Enter your username...'
                />
                <Input
                    withLabel
                    label='Steam link'
                    labelClassName={classes.label}
                    type='text'
                    name='steamLink'
                    defaultValue={profileData?.steamLink || undefined}
                    placeholder='Enter your steam link...'
                />
                <Input
                    withLabel
                    label='Email'
                    labelClassName={classes.label}
                    type='email'
                    name='email'
                    defaultValue={profileData?.email || undefined}
                    placeholder='john@example.com'
                />
                <Input
                    withLabel
                    label='First name'
                    labelClassName={classes.label}
                    type='text'
                    name='firstName'
                    defaultValue={profileData?.firstName || undefined}
                    placeholder='Enter your first name...'
                />
                <Input
                    withLabel
                    label='Last name'
                    labelClassName={classes.label}
                    type='text'
                    name='lastName'
                    defaultValue={profileData?.lastName || undefined}
                    placeholder='Enter your last name...'
                />
                <div className={classes.buttons}>
                    <Button
                        type='reset'
                        size='lg'
                        asChild
                        className={classes.btn}
                    >
                        <Link to='/profile'>Cancel</Link>
                    </Button>
                    <Button
                        type='submit'
                        size='lg'
                        className={`${classes.btn} ${classes.accent}`}
                    >
                        Save
                    </Button>
                </div>
            </form>
        </div>
    )
}
