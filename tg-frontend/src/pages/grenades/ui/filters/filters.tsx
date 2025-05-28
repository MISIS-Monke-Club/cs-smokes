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

export function GrenadesFilters() {
    const { addParams, deleteParams } = useQueryPrams()

    function handleChange(val: boolean) {
        if (val) {
            addParams("is_favorites", "true")
        } else {
            deleteParams("is_favorites")
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
                    <SheetTitle>Grenades options</SheetTitle>
                    <SheetDescription>
                        Here you can shape representation of grenades
                    </SheetDescription>
                </SheetHeader>
                <div>
                    <Label htmlFor={switchId}>Only approved</Label>
                    <Switch id={switchId} onCheckedChange={handleChange} />
                </div>
            </SheetContent>
        </Sheet>
    )
}
