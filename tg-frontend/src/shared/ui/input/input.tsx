import clsx from "clsx"
import { useId } from "react"
import classes from "./input.module.scss"

const sprite = "/svg-sprite.svg"

type InputProps = React.ComponentProps<"input"> & {
    withLabel?: boolean
    label?: string
    whithIcon?: boolean
    iconPosition?: "before"
    inputClassName?: string
    labelClassName?: string
}

export const Input = ({
    withLabel = false,
    label,
    whithIcon = false,
    iconPosition = "before",
    inputClassName,
    labelClassName,
    className,
    ...props
}: InputProps) => {
    const inputClass = clsx(classes.input, inputClassName, className)
    const labelClass = clsx(classes.label, labelClassName)

    const id = useId()

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

    if (whithIcon) {
        if (iconPosition === "before") {
            return (
                <div className={classes.inputWrapper}>
                    <svg className={classes.icon}>
                        <use href={`${sprite}#search`} />
                    </svg>
                    {inputElement}
                </div>
            )
        }
    }

    return inputElement
}
