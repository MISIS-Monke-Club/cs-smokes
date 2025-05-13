import clsx from "clsx"
import { useId } from "react"
import classes from "./input.module.scss"

type InputProps = React.ComponentProps<"input"> & {
    withLabel?: boolean
    label?: string
    inputClassName?: string
    labelClassName?: string
}

export const Input = ({
    withLabel = false,
    label,
    inputClassName,
    labelClassName,
    ...props
}: InputProps) => {
    const inputClass = clsx(classes.input, inputClassName)
    const labelClass = clsx(classes.label, labelClassName)

    const generatedId = useId()
    const id = label ? `${label}-${generatedId}` : generatedId

    const inputElement = <input id={id} className={inputClass} {...props} />

    if (withLabel && label) {
        return (
            <div className={classes.inputGroup}>
                <label htmlFor={id} className={labelClass}>
                    {label}
                </label>
                {inputElement}
            </div>
        )
    }

    return inputElement
}
