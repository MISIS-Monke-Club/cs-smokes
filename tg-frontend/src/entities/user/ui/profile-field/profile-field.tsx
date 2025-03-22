import React from "react"

type ProfileFieldProps = {
    label: string
    value: React.ReactNode
}

export function ProfileField({ label, value }: ProfileFieldProps) {
    return (
        <label>
            <span>{label}:</span>
            <span>{value}</span>
        </label>
    )
}
