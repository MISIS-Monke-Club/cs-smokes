import { useQuery } from "@tanstack/react-query"
import { grenadeApi, GrenadesListComponent } from "@entities/grenade"
import { favoritesMaper } from "@features/favorites/get"
import { useQueryPrams } from "@shared/lib/params-parser"

export function GrenadesListWidget() {
    const { params } = useQueryPrams()

    const {
        data: grenades,
        isLoading,
        isError,
    } = useQuery(
        grenadeApi.getGrenadesOptions({
            query: params.get("search")?.toString(),
            ordering: params.get("ordering")?.toString(),
            is_approved: params.get("is_favorites")?.toString(),
        })
    )

    return (
        <GrenadesListComponent
            grenades={grenades}
            isLoading={isLoading}
            isError={isError}
            mapFunction={favoritesMaper}
        />
    )
}
