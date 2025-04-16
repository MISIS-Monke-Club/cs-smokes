import { GrenadeModel, GrenadesListMaper } from "../../model/domain"
import { ItemsList } from "@shared/ui/items-list"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

type GrenadesListProps = {
    grenades?: GrenadeModel[]
    mapFunction?: GrenadesListMaper
    isError?: boolean
    isLoading?: boolean
}

// Component that ONLY displays provided data, all api requests moved to the features
export function GrenadesListComponent({
    grenades,
    isError,
    isLoading,
    mapFunction,
}: GrenadesListProps) {
    if (isError) {
        return (
            <PlaceholderBlock>
                Something went wrong in grenades list...
            </PlaceholderBlock>
        )
    }

    return (
        <ItemsList
            elements={grenades}
            mapFunction={mapFunction}
            isLoading={isLoading}
            loadingItemsLength={5}
        />
    )
}
