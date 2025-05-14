import { ReactNode, useMemo } from "react"
import { ComponentsRepeater } from "../components-repeater"
import { Skeleton } from "../skeleton"
import classes from "./items-list.module.scss"

type ItemsListProps<T> = React.ComponentProps<"div"> & {
    elements?: T[]
    mapFunction?: (items: T[]) => ReactNode
    isLoading?: boolean
    isPending?: boolean
    loadingItemsLength?: number
    type?: "grid" | "column"
    gap?: "small" | "medium" | "large"
    columnsMode?: "fixed-amount" | "custom"
    customColumnsClassName?: string
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
    columnsMode = "fixed-amount",
    customColumnsClassName = "",
    columnsAmount = 2,
    displayedLoadingItem = <Skeleton widthInPixels={200} heightInPixels={30} />,
    style = {},
    ...rest
}: ItemsListProps<T>) {
    const computedStyles: React.CSSProperties = useMemo(() => {
        const draftStyle = { ...style }

        if (columnsMode === "custom" || customColumnsClassName) {
            return style
        }

        if (columnsAmount > 10) {
            draftStyle.gridTemplateColumns = "repeat(10, 1fr)"
        } else if (columnsAmount <= 0) {
            draftStyle.gridTemplateColumns = "repeat(1, 1fr)"
        } else {
            draftStyle.gridTemplateColumns = `repeat(${columnsAmount}, 1fr)`
        }

        return draftStyle
    }, [columnsAmount, columnsMode, customColumnsClassName, style])

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
            string
        > = {
            large: classes.lgGap,
            medium: classes.mdGap,
            small: classes.smGap,
        }

        if (className) {
            classesArray.push(className)
        }

        if (type && elements?.length !== 0) {
            classesArray.push(typeClasses[type])
        } else if (elements?.length === 0) {
            classesArray.push(typeClasses.column)
        }

        if (elements?.length === 0) {
            classesArray.push(classes.emptyList as string)
        }

        if (gap) {
            classesArray.push(gapClasses[gap])
        }

        if (columnsMode === "custom" || customColumnsClassName) {
            classesArray.push(customColumnsClassName)
        }

        return classesArray.join(" ")
    }, [
        className,
        type,
        elements?.length,
        gap,
        columnsMode,
        customColumnsClassName,
    ])

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

    if (!elements || elements.length === 0 || !mapFunction) {
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
