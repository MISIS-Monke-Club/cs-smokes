import { HTMLProps, useEffect, useMemo, useState } from "react"
import { Skeleton } from "./skeleton"
import classes from "./image.module.scss"

type ImageProps = HTMLProps<HTMLImageElement> & {
    url?: string
    skeletonClasses?: string
}

export function ImageComponent({
    url,
    className = "",
    skeletonClasses = "",
    ...rest
}: ImageProps) {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [hasMounted, setHasMounted] = useState<boolean>(false)

    useEffect(() => {
        // Flag means that image was started loading
        setHasMounted(true)
    }, [])

    const combinedClass: string = useMemo(() => {
        let draftClass: string = className

        if (!url) {
            draftClass += " " + classes.fakeImage
        }

        return draftClass
    }, [url])

    if (!url) {
        return <img className={combinedClass} {...rest} />
    }

    return (
        <>
            {isLoading && hasMounted && (
                <Skeleton
                    className={`${className} ${skeletonClasses} ${classes.fakeImage}`}
                    {...rest}
                />
            )}
            <img
                className={combinedClass}
                src={url}
                loading='lazy'
                onLoad={() => setIsLoading(false)}
                style={{ display: isLoading && hasMounted ? "none" : "" }}
                {...rest}
            />
        </>
    )
}
