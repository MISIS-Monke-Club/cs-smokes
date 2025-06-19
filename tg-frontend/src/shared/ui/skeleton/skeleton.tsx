import { cn } from "../../lib/utils"

type SkeletonProps = React.ComponentProps<"div"> & {
    widthInPixels?: number
    heightInPixels?: number
}

export function Skeleton({
    className,
    widthInPixels = 150,
    heightInPixels = 30,
    ...props
}: SkeletonProps) {
    return (
        <div
            style={{
                width: `${widthInPixels}px`,
                height: `${heightInPixels}px`,
                ...props.style,
            }}
            data-slot='skeleton'
            aria-label='placeholder-skeleton'
            className={cn("bg-primary/10 animate-pulse rounded-md", className)}
            {...props}
        />
    )
}
