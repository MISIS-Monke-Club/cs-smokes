import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { mapPageParamsSchema } from "../map-page/domain"
import { MapModel } from "@entities/map"
import { MapInfo } from "@widgets/map-info"

export function MapInfoPage() {
    const params = useParams()

    const mapId = useMemo(() => {
        const draftId: MapModel["mapId"] =
            mapPageParamsSchema.parse(params).mapId

        return draftId
    }, [params])

    return (
        <>
            <MapInfo mapId={mapId} />
        </>
    )
}
