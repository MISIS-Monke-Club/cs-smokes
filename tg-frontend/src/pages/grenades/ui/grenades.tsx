import classes from "./grenades.module.scss"
import { GrenadesList } from "@features/grenade/get-list"

export function Grenades() {
    return (
        <>
            <h1 className={classes.title}>Grenades list</h1>
            <GrenadesList />
        </>
    )
}
