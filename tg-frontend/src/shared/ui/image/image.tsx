import { HTMLProps, useMemo } from "react"
import { CircleUser } from "lucide-react"
import { Skeleton } from "../skeleton"
import classes from "./image.module.scss"

type ImageProps = Omit<HTMLProps<HTMLImageElement>, "src"> & {
    url: string | null
    skeletonClasses?: string
    isLoading?: boolean
    placeholderElement?: React.ReactNode
}

export function ImageComponent({
    url,
    className = "",
    skeletonClasses = "",
    isLoading = false,
    placeholderElement = <CircleUser />,
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
            draftClass.push(skeletonClasses.split(" "))
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

    if (isLoading) {
        return (
            <Skeleton
                className={placeholderClass}
                widthInPixels={placeholderSize.width}
                heightInPixels={placeholderSize.height}
                {...rest}
            />
        )
    }

    if (!url || url.length === 0)
        return <div className={skeletonClasses}>{placeholderElement}</div>

    return <img className={combinedClass} src={url} loading='lazy' {...rest} />
}
