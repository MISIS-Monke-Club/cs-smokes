import classes from "./grenades.module.scss"
import { GrenadesWidget } from "@widgets/grenades-widget"

export function Grenades() {
    return (
        <>
            <h1 className={classes.title}>Grenades list</h1>
            <GrenadesWidget />
        </>
    )
}
