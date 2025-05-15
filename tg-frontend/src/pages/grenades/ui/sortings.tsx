import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
} from "@radix-ui/react-select"
import { useQueryPrams } from "@shared/lib/params-parser"
import { Button } from "@shared/ui/button"
import { Icons } from "@shared/ui/icons"
import {
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    Sheet,
} from "@shared/ui/sheet"

export function GrenadesSortings() {
    const { params, addParams } = useQueryPrams()

    function handleSoringsChange(val: string) {
        addParams("ordering", val)
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button size='icon'>
                    <Icons.SortIcon />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Grenades options</SheetTitle>
                    <SheetDescription>
                        Here you can shape representation of grenades
                    </SheetDescription>
                </SheetHeader>
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
            </SheetContent>
        </Sheet>
    )
}
