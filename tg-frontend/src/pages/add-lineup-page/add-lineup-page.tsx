import classes from "./add-lineup-page.module.scss"
import { AddLineupForm } from "@features/grenade/add-grenade"

export function AddLineupPage() {
    return (
        <div>
            <h1 className={classes.title}>Add Lineup Page</h1>
            <AddLineupForm />
        </div>
    )
}
