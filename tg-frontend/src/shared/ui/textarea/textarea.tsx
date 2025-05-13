import clsx from "clsx"
import { useId } from "react"
import classes from "./textarea.module.scss"

type TextareaProps = React.ComponentProps<"textarea"> & {
    withLabel?: boolean
    label?: string
    textareaClassName?: string
    labelClassName?: string
}

export const Textarea = ({
    withLabel = false,
    label,
    textareaClassName,
    labelClassName,
    ...props
}: TextareaProps) => {
    const textareaClass = clsx(classes.textarea, textareaClassName)
    const labelClass = clsx(classes.label, labelClassName)

    const generatedId = useId()
    const id = label ? `${label}-${generatedId}` : generatedId

    const textareaElement = (
        <textarea id={id} className={textareaClass} {...props} />
    )

    if (withLabel && label) {
        return (
            <div className={classes.textareaGroup}>
                <label htmlFor={id} className={labelClass}>
                    {label}
                </label>
                {textareaElement}
            </div>
        )
    }

    return textareaElement
}
