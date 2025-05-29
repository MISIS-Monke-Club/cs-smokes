import clsx from "clsx"
import classes from "./badge.module.scss"

type BadgeProps = React.PropsWithChildren & {
    color?: "accent" | "disabled" | "danger" | "success"
    radius?: "sm" | "md" | "lg"
}

export function Badge({
    color = "success",
    radius = "md",
    children,
}: BadgeProps) {
    return (
        <span
            className={clsx(
                classes.badge,
                classes[`color-${color}`],
                classes[`radius-${radius}`]
            )}
        >
            {children}
        </span>
    )
}
