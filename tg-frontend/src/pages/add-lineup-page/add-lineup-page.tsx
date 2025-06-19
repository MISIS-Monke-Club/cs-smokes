import classes from "./add-lineup-page.module.scss"
import { AddLineupForm } from "@features/grenade/add-grenade"

export function AddLineupPage() {
    return (
        <div className={classes.wrapper}>
            <AddLineupForm />
        </div>
    )
}
