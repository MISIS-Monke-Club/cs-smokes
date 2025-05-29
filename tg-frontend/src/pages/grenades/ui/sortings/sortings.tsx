import classes from "./sortings.module.scss"
import { useQueryPrams } from "@shared/lib/params-parser"
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
import { Icons } from "@shared/ui/icons"

export function GrenadesSortings() {
    const { params, addParams } = useQueryPrams()

    function handleSoringsChange(val: string) {
        addParams("ordering", val)
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <div className={classes.trigger}>
                    <Icons.SortIcon />
                </div>
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
                                <SelectItem value='date_of_creation'>
                                    By date of creation
                                </SelectItem>
                                <SelectItem value='by_alphabet'>
                                    By alphabet
                                </SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Downwards sorting</SelectLabel>
                                <SelectItem value='-date_of_creation'>
                                    By date of creation
                                </SelectItem>
                                <SelectItem value='-by_alphabet'>
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
