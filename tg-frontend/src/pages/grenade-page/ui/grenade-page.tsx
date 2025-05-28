import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { grenadePageParamsSchema } from "../domain"
import classes from "./grenade-page.module.scss"
import { GoBack } from "@features/go-back"
import { grenadeApi, GrenadeOverview } from "@entities/grenade"
import { Button } from "@shared/ui/button"
import { ToggleFavorites } from "@features/favorites/toggle"
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

    const {
        data: grenade,
        isLoading,
        isError,
    } = useQuery(grenadeApi.getGrenadesByIdOptions({ grenadeId }))

    return (
        <>
            <GoBack className={classes.goBack} />
            <GrenadeOverview
                grenade={grenade}
                isError={isError}
                isLoading={isLoading}
                actions={
                    <>
                        <div className={classes.actionsWrapper}>
                            <Button className={classes.viewLineup} asChild>
                                <Link to={grenade?.linkToVideo || ""}>
                                    View lineup
                                </Link>
                            </Button>
                            {grenade && (
                                <ToggleFavorites
                                    grenadeId={grenade?.grenadeId}
                                />
                            )}
                        </div>
                    </>
                }
            />
        </>
    )
}
