import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { grenadePageParamsSchema } from "../domain"
import classes from "./grenade-page.module.scss"
import { GoBack } from "@features/go-back"
import { GetGrenade } from "@features/get-grenade"
// import { useParams } from "react-router-dom"

export function GrenadePage() {
    const params = useParams()

    const grenadeId = useMemo(() => {
        let draftId = 1

        try {
            draftId = grenadePageParamsSchema.parse(params).grenadeId
        } catch (err) {
            console.error(err)
        }

        return draftId
    }, [params])

    return (
        <>
            <GoBack className={classes.goBack} />
            <GetGrenade grenadeId={grenadeId} />
        </>
    )
}
