import { GrenadeModel } from "../domain"
import { grenadeMaper } from ".."
import { ItemsList } from "@shared/ui/items-list"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

export function GrenadesList({ grenades }: { grenades?: GrenadeModel[] }) {
    if (!grenades || grenades.length === 0) {
        return <PlaceholderBlock />
    }

    return <ItemsList elements={grenades} mapFunction={grenadeMaper} />
}
