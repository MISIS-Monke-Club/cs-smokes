import { useNavigate } from "react-router-dom"
import React, { ReactNode, useMemo } from "react"
import { GrenadeModel } from "../../model/domain"
import classes from "./grenade.module.scss"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@shared/ui/card"
import { dateFormatter } from "@shared/lib/date-formatter"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

type GrenadeProps = React.ComponentProps<"div"> & {
    grenade: GrenadeModel
    bottomSlot?: ReactNode
    className?: string
    isLoading?: boolean
    isError?: boolean
}

export function Grenade({
    grenade,
    bottomSlot = "",
    className = "",
    isLoading = false,
    isError = false,
    ...rest
}: GrenadeProps) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(`/grenades/${grenade.grenadeId}`)
    }

    const date = useMemo(() => {
        if (!grenade) {
            return dateFormatter({
                isoDatetime: new Date().toString(),
                day: true,
                month: true,
            })
        }

        return dateFormatter({
            isoDatetime: grenade.createdAt,
            day: true,
            month: true,
        })
    }, [grenade])

    const combinedClass: string = useMemo(() => {
        const draftClass = [classes.grenadeCard]

        if (className) {
            draftClass.push(className)
        }

        return draftClass.join(" ")
    }, [className])

    if (isLoading) {
        return <div>loading...</div>
    }

    if (isError) {
        return <PlaceholderBlock>Error happened...</PlaceholderBlock>
    }

    if (!grenade) {
        return <PlaceholderBlock>Something went wrong...</PlaceholderBlock>
    }

    return (
        <Card className={combinedClass} onClick={clickHandler} {...rest}>
            <CardHeader>
                <CardTitle>Grenade id:{grenade?.grenadeId}</CardTitle>
                <CardDescription>view cool grenade</CardDescription>
            </CardHeader>
            <CardContent>
                <img
                    src='/grenade-image.jpg'
                    alt='grenade image'
                    loading='lazy'
                />
                <div>Created at:{date}</div>
            </CardContent>
            <CardFooter>{bottomSlot}</CardFooter>
        </Card>
    )
}
