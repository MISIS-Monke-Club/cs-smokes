import clsx from "clsx"
import classes from "./badge.module.scss"

type BadgeProps = React.PropsWithChildren & {
    color?: "accent" | "disabled" | "danger" | "success"
    radius?: "sm" | "md" | "lg"
    className?: string
}

export function Badge({
    color = "success",
    radius = "md",
    children,
    className = "",
}: BadgeProps) {
    return (
        <span
            className={clsx(
                classes.badge,
                classes[`color-${color}`],
                classes[`radius-${radius}`],
                className
            )}
        >
            {children}
        </span>
    )
}
