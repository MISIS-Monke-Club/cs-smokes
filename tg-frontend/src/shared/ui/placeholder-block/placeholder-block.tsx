import { ReactNode } from "react"

type PlaceholderBlockProps = React.ComponentProps<"div"> & {
    children?: ReactNode
}

export function PlaceholderBlock({
    children = "No data was provided(",
    ...rest
}: PlaceholderBlockProps) {
    return <div {...rest}>{children}</div>
}
