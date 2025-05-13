import clsx from "clsx"
import { useId } from "react"
import classes from "./select.module.scss"

type SelectProps = React.ComponentProps<"select"> & {
    withLabel?: boolean
    label?: string
    selectClassName?: string
    labelClassName?: string
    options?: Array<{ value: string; label: string }>
}

export const Select = ({
    withLabel = false,
    label,
    selectClassName,
    labelClassName,
    options,
    ...props
}: SelectProps) => {
    const selectClass = clsx(classes.select, selectClassName)
    const labelClass = clsx(classes.label, labelClassName)

    const generatedId = useId()
    const id = label ? `${label}-${generatedId}` : generatedId

    const selectElement = (
        <select id={id} className={selectClass} {...props}>
            {options?.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    )

    if (withLabel && label) {
        return (
            <div className={classes.selectGroup}>
                <label htmlFor={id} className={labelClass}>
                    {label}
                </label>
                {selectElement}
            </div>
        )
    }

    return selectElement
}
