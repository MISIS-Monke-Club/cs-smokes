import classes from "./grenades.module.scss"
import { GrenadesList } from "@features/grenades-list"

export function Grenades() {
    return (
        <>
            <h1 className={classes.title}>Grenades list</h1>
            <GrenadesList />
        </>
    )
}
