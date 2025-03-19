import { HTMLProps, useMemo } from "react"
import { Skeleton } from "../skeleton"
import classes from "./image.module.scss"

type ImageProps = HTMLProps<HTMLImageElement> & {
    url?: string
    skeletonClasses?: string
    isLoading?: boolean
}

export function ImageComponent({
    url,
    className = "",
    skeletonClasses = "",
    isLoading = false,
    ...rest
}: ImageProps) {
    const combinedClass: string = useMemo(() => {
        const draftClass: string[] = []

        if (className) {
            draftClass.push(className)
        }

        return draftClass.join(" ")
    }, [className])

    const placeholderClass: string = useMemo(() => {
        const draftClass = [classes.fakeImage]

        if (skeletonClasses) {
            draftClass.push(skeletonClasses)
        }

        return draftClass.join(" ")
    }, [skeletonClasses])

    const placeholderSize: { width: number; height: number } = useMemo(() => {
        const draftWidth = {
            width: 100,
            height: 100,
        }

        if (rest.width) {
            draftWidth.width = Number(rest.width)
        }

        if (rest.height) {
            draftWidth.height = Number(rest.height)
        }

        return draftWidth
    }, [rest.height, rest.width])

    if (isLoading || !url) {
        return (
            <Skeleton
                className={placeholderClass}
                widthInPixels={placeholderSize.width}
                heightInPixels={placeholderSize.height}
                {...rest}
            />
        )
    }

    return <img className={combinedClass} src={url} loading='lazy' {...rest} />
}
