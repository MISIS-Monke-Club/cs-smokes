import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { mapPageParamsSchema } from "./domain"
import { MapOverview } from "@widgets/map-overview"
import { MapModel } from "@entities/map"

export function MapPage() {
    const params = useParams()

    const mapId = useMemo(() => {
        const draftId: MapModel["mapId"] =
            mapPageParamsSchema.parse(params).mapId

        return draftId
    }, [params])

    if (!mapId) {
        return <div>Cant get mapId</div>
    }

    return (
        <div className='mb-25 contents'>
            <MapOverview mapId={mapId} />
        </div>
    )
}
