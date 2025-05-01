import clsx from "clsx"
import classes from "./input.module.scss"

type InputProps = {
    withLabel?: boolean
    label?: string
    type?:
        | "text"
        | "number"
        | "email"
        | "password"
        | "tel"
        | "date"
        | "textarea"
        | "select"
    placeholder?: string
    inputClassNmae?: string
    labelClassName?: string
    disabled?: boolean
    required?: boolean
    options?: { value: string; label: string }[]
}

export const Input = ({
    withLabel = false,
    label = "",
    type = "text",
    placeholder = "",
    inputClassNmae = "",
    labelClassName = "",
    disabled = false,
    required = false,
    options = [],
}: InputProps) => {
    const inputClass = clsx(
        type === "textarea"
            ? (classes.textarea, classes.input)
            : type === "select"
              ? (classes.select, classes.input)
              : classes.input,
        inputClassNmae
    )
    const labelClass = clsx(classes.label, labelClassName)

    const renderInput = () => {
        const commonProps = {
            className: inputClass,
            disabled,
            required,
            placeholder,
            id: label ? `${label}-input` : undefined,
        }

        switch (type) {
            case "textarea":
                return <textarea {...commonProps} />
            case "select":
                return (
                    <select {...commonProps}>
                        <option value='' disabled>
                            {placeholder || "Выберите вариант"}
                        </option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                )
            default:
                return <input type={type} {...commonProps} />
        }
    }

    if (withLabel) {
        return (
            <div className={classes.inputGroup}>
                {label && (
                    <label
                        htmlFor={label ? `${label}-input` : undefined}
                        className={labelClass}
                    >
                        {label}
                    </label>
                )}
                {renderInput()}
            </div>
        )
    }

    return renderInput()
}
