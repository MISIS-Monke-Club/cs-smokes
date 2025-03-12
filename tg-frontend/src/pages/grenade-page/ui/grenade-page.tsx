import { GoBack } from "@features/go-back"
import { GrenadeOverview } from "@widgets/grenade-overview/grenade-overview"
import classes from "./grenade-page.module.scss"
import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { grenadePageParamsSchema } from "../domain"
// import { useParams } from "react-router-dom"

export function GrenadePage() {
    const params = useParams()

    const grenadeId = useMemo(() => {
        let draftId: number = 1

        try {
            draftId = grenadePageParamsSchema.parse(params).grenadeId
        } catch (err) {
            console.error(err)
        }

        return draftId
    }, [])

    return (
        <>
            <GoBack className={classes.goBack} />
            <GrenadeOverview grenadeId={grenadeId} />
        </>
    )
}
