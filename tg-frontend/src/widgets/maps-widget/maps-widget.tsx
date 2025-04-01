import { useQuery } from "@tanstack/react-query"
import { mapApi, MapsList } from "@entities/map"

export function MapsWidget() {
    const { data = [] } = useQuery(mapApi.getMaps())

    return (
        <>
            <MapsList maps={data} />
        </>
    )
}
