import { ReactNode, useMemo } from "react"
import { ComponentsRepeater } from "../components-repeater"
import { Skeleton } from "../skeleton"
import classes from "./items-list.module.scss"

type ItemsListProps<T> = React.ComponentProps<"div"> & {
    elements: T[]
    mapFunction: (items: T[]) => ReactNode
    isLoading?: boolean
    loadingItemsLength?: number
    type?: "grid" | "column"
    gap: "small" | "medium" | "large"
    columnsAmount?: number
    displayedLoadingItem?: ReactNode
}

export function ItemsList<T>({
    elements,
    mapFunction,
    type = "grid",
    isLoading = false,
    loadingItemsLength = 10,
    gap = "medium",
    className = "",
    columnsAmount = 2,
    displayedLoadingItem = <Skeleton widthInPixels={200} heightInPixels={30} />,
    ...rest
}: ItemsListProps<T>) {
    const computedStyles: React.CSSProperties = useMemo(() => {
        const draftStyle = { ...rest.style }

        if (columnsAmount > 10) {
            draftStyle.gridTemplateColumns = "repeat(10, 1fr)"
        } else if (columnsAmount <= 0) {
            draftStyle.gridTemplateColumns = "repeat(1, 1fr)"
        } else {
            draftStyle.gridTemplateColumns = `repeat(${columnsAmount}, 1fr)`
        }

        return draftStyle
    }, [columnsAmount, rest.style])

    const combinedClassName: string = useMemo(() => {
        const classesArray: string[] = [classes.list]

        const typeClasses: Record<
            NonNullable<ItemsListProps<T>["type"]>,
            string
        > = {
            grid: classes.grid,
            column: classes.column,
        }

        const gapClasses: Record<
            NonNullable<ItemsListProps<T>["gap"]>,
            "string"
        > = {
            large: classes.smGap,
            medium: classes.mdGap,
            small: classes.lgGap,
        }

        if (className) {
            classesArray.push(className)
        }

        if (type && elements.length !== 0) {
            classesArray.push(typeClasses[type])
        } else if (elements.length === 0) {
            classesArray.push(typeClasses.column)
        }

        if (elements.length === 0) {
            classesArray.push(classes.emptyList as string)
        }

        if (gap) {
            classesArray.push(gapClasses[gap])
        }

        return classesArray.join(" ")
    }, [className, type, gap, elements.length])

    if (elements.length === 0) {
        return (
            <div
                className={combinedClassName}
                aria-label='empty-items-list'
                style={computedStyles}
                {...rest}
            >
                <p>No data was provided(</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div
                className={combinedClassName}
                aria-label='empty-items-list'
                style={computedStyles}
                {...rest}
            >
                <ComponentsRepeater length={loadingItemsLength}>
                    {displayedLoadingItem}
                </ComponentsRepeater>
            </div>
        )
    }

    return (
        <div
            className={combinedClassName}
            style={computedStyles}
            aria-label='items-list'
            {...rest}
        >
            {mapFunction(elements)}
        </div>
    )
}
