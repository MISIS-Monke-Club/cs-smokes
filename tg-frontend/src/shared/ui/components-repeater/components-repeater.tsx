import { ReactNode } from "react"
import React from "react"

type ComponentsRepeaterProps = {
    children?: ReactNode
    length: number
    randomizedWidth?: boolean
    minWidthValue?: number
    maxWidthValue?: number
}

export function ComponentsRepeater({
    children,
    length,
    randomizedWidth,
    maxWidthValue = 100,
    minWidthValue = 0,
}: ComponentsRepeaterProps) {
    if (randomizedWidth) {
        return (
            <>
                {Array.from({ length }).map(() => {
                    // Getting random number between min max
                    const width: number =
                        Math.floor(
                            Math.random() * (maxWidthValue - minWidthValue + 1)
                        ) + minWidthValue

                    return (
                        <div
                            style={{ width: width.toString() + "%" }}
                            aria-label='copied-element'
                            key={crypto.randomUUID()}
                        >
                            {children}
                        </div>
                    )
                })}
            </>
        )
    }
    return (
        <>
            {Array.from({ length }).map(() => (
                <React.Fragment key={crypto.randomUUID()}>
                    {children}
                </React.Fragment>
            ))}
        </>
    )
}
