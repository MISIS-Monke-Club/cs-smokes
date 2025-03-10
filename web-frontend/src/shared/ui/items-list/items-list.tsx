import classes from "./items-list.module.scss"
import { ReactNode } from "react"

type ItemsListProps<T> = {
    elements: T[]
    mapFunction: (items: T[]) => ReactNode
    isLoading?: boolean
}

export function ItemsList<T>({
    elements,
    mapFunction,
    isLoading = false,
}: ItemsListProps<T>) {
    if (isLoading)
        if (elements.length === 0) {
            return <div>Загрузка...</div>
        }

    return <div className={classes.list}>{mapFunction(elements)}</div>
}
