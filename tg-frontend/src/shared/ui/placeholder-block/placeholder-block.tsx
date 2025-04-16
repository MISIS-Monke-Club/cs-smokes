import { ReactNode } from "react"

export function PlaceholderBlock({
    children = "No data was provided(",
}: {
    children?: ReactNode
}) {
    return <div>{children}</div>
}
