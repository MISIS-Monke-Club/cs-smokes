import classes from "./sortings.module.scss"
import { useQueryPrams } from "@shared/lib/params-parser"
import { Button } from "@shared/ui/button"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectTrigger,
    SelectValue,
    SelectItem,
} from "@shared/ui/shadcn-select"
import {
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    Sheet,
} from "@shared/ui/sheet"
import { queryParamsConfig } from "@shared/config/query-params"

export function GrenadesSortings() {
    const { byAlphabet, byLineupsCount, byPopularity } =
        queryParamsConfig.maps.sortings
    const { params, addParams } = useQueryPrams()

    function handleSoringsChange(val: string) {
        addParams("ordering", val)
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button>Click me</Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Grenades options</SheetTitle>
                    <SheetDescription>
                        Here you can shape representation of grenades
                    </SheetDescription>
                </SheetHeader>
                <div className={classes.content}>
                    <Select
                        onValueChange={handleSoringsChange}
                        defaultValue={params.get("ordering")?.toString()}
                    >
                        <SelectTrigger className='w-[200px]'>
                            <SelectValue placeholder='Sort by...' />
                        </SelectTrigger>
                        <SelectContent className='w-[220px]'>
                            <SelectGroup>
                                <SelectLabel>Upwards sorting</SelectLabel>
                                <SelectItem value={byPopularity.asc}>
                                    By popularity
                                </SelectItem>
                                <SelectItem value={byLineupsCount.asc}>
                                    By lineups count
                                </SelectItem>
                                <SelectItem value={byAlphabet.asc}>
                                    By alphabet
                                </SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Downwards sorting</SelectLabel>
                                <SelectItem value={byPopularity.desc}>
                                    By popularity
                                </SelectItem>
                                <SelectItem value={byLineupsCount.desc}>
                                    By lineups count
                                </SelectItem>
                                <SelectItem value={byAlphabet.desc}>
                                    By alphabet
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </SheetContent>
        </Sheet>
    )
}
