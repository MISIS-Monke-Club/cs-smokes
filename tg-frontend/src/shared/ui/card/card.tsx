import * as React from "react"
import clsx from "clsx"
import classes from "./card.module.scss"

type CardComponentProps = React.ComponentProps<"div"> & {
    isLoading?: boolean
    subheading?: string
    heading?: string
    bottomSlot?: React.ReactNode
    topSlot?: React.ReactNode
    imgUrl?: string
    imgAlt?: string
}

export function CardComponent({
    isLoading = false,
    subheading,
    heading,
    bottomSlot,
    topSlot,
    imgUrl,
    imgAlt,
    className,
    ...rest
}: CardComponentProps) {
    if (isLoading) {
        return <div></div>
    }

    return (
        <Card className={clsx(classes.cardComponent, className)} {...rest}>
            {topSlot && (
                <CardHeader className={classes.topSlot}>{topSlot}</CardHeader>
            )}
            <CardContent>
                <img
                    className={classes.img}
                    src={imgUrl}
                    alt={imgAlt}
                    width='130'
                    height='65'
                    loading='lazy'
                />
                <div className={classes.textWrapper}>
                    <h4>{heading}</h4>
                    {subheading && (
                        <p className={classes.subheading}>{subheading}</p>
                    )}
                </div>
            </CardContent>
            {bottomSlot && (
                <CardFooter className={classes.bottomSlot}>
                    {bottomSlot}
                </CardFooter>
            )}
        </Card>
    )
}

function Card({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot='card'
            aria-label='card'
            className={clsx(classes.card, className)}
            {...props}
        />
    )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot='card-header'
            className={clsx("flex flex-col gap-1.5", classes.header, className)}
            {...props}
        />
    )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot='card-title'
            className={clsx(
                "leading-none font-semibold",
                classes.title,
                className
            )}
            {...props}
        />
    )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot='card-description'
            className={clsx("text-muted-foreground text-sm", className)}
            {...props}
        />
    )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot='card-content' className={className} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot='card-footer'
            className={clsx("flex items-center", className)}
            {...props}
        />
    )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
