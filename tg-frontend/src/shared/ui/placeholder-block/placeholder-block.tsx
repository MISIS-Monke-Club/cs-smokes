import { ReactNode } from "react"
import classes from "./placeholder-block.module.scss"

export function PlaceholderBlock({
    children = "No data was provided(",
}: {
    children?: ReactNode
}) {
    return <div className={classes.placeholderBlock}>{children}</div>
}
