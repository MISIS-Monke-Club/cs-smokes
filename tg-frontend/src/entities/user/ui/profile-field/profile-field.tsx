import React from "react"
import classes from "./profile-field.module.scss"

type ProfileFieldProps = {
    label: string
    value: React.ReactNode
}

export function ProfileField({ label, value }: ProfileFieldProps) {
    return (
        <div className={classes.field}>
            <label className={classes.label}>{label}</label>
            <span className={classes.value}>{value}</span>
        </div>
    )
}
