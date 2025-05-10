import clsx from "clsx"
import classes from "./input.module.scss"

type InputProps = React.ComponentProps<"input"> & {
    withLabel?: boolean
    label?: string
    inputClassNmae?: string
    labelClassName?: string
}

export const Input = ({
    withLabel = false,
    label,
    inputClassNmae,
    labelClassName,
    ...props
}: InputProps) => {
    const inputClass = clsx(classes.input, inputClassNmae)
    const labelClass = clsx(classes.label, labelClassName)

    const id = label ? `${label}-input` : undefined

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
