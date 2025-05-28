import { useId } from "react"
import classes from "./filters.module.scss"
import { useQueryPrams } from "@shared/lib/params-parser"
import {
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    Sheet,
} from "@shared/ui/sheet"
import { Icons } from "@shared/ui/icons"
import { Switch } from "@shared/ui/switch"
import { Label } from "@shared/ui/label"

export function MapsFilters() {
    const { addParams, deleteParams } = useQueryPrams()

    function handleChange(val: boolean) {
        if (val) {
            addParams("is_esports_pool", "true")
        } else {
            deleteParams("is_esports_pool")
        }
    }

    const switchId = useId()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <div className={classes.trigger}>
                    <Icons.FilterIcon />
                </div>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Maps options</SheetTitle>
                    <SheetDescription>
                        You can filter maps by esports pool
                    </SheetDescription>
                </SheetHeader>
                <div>
                    <Label htmlFor={switchId}>Only esports maps</Label>
                    <Switch id={switchId} onCheckedChange={handleChange} />
                </div>
            </SheetContent>
        </Sheet>
    )
}
