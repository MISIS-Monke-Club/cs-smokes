import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { ReactNode, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
                destructive:
                    "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
                outline:
                    "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

type ButtonProps = React.ComponentProps<"button"> & {
    variant?:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link"
    size?: "default" | "sm" | "lg" | "icon"
    asChild?: boolean
    isLoading?: boolean
    loaderPosition?: "before" | "after"
    loaderElement?: ReactNode
}

export function Button({
    className,
    variant,
    size,
    asChild = false,
    isLoading = false,
    loaderPosition = "before",
    loaderElement = <Loader2 className='animate-spin' />,
    ...props
}: ButtonProps) {
    const combinedButtonClass: string = useMemo(() => {
        const draftClass: string = cn(
            buttonVariants({ variant, size, className })
        )

        return draftClass
    }, [variant, size, className])

    if (isLoading) {
        if (size === "icon") {
            return (
                <button
                    type='button'
                    data-slot='button'
                    className={combinedButtonClass}
                    {...props}
                    disabled={true}
                >
                    {loaderElement}
                </button>
            )
        } else {
            if (loaderPosition === "before") {
                return (
                    <button
                        type='button'
                        data-slot='button'
                        className={combinedButtonClass}
                        {...props}
                        disabled={true}
                    >
                        {loaderElement}
                        {props.value}
                    </button>
                )
            } else if (loaderPosition === "after") {
                return (
                    <button
                        type='button'
                        data-slot='button'
                        className={combinedButtonClass}
                        {...props}
                        disabled={true}
                    >
                        {props.value}
                        {loaderElement}
                    </button>
                )
            }
        }
    }

    if (asChild) {
        return (
            <Slot
                data-slot='button'
                className={combinedButtonClass}
                {...props}
            />
        )
    }

    return (
        <button
            type='button'
            data-slot='button'
            className={combinedButtonClass}
            {...props}
        />
    )
}
