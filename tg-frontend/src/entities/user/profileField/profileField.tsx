import React from "react"
import classes from "./profileField.module.scss"

type ProfileFieldProps = {
    label: string
    value: React.ReactNode
}

export const ProfileField: React.FC<ProfileFieldProps> = ({ label, value }) => {
    return (
        <label className={classes.label}>
            <span>{label}:</span>
            <span>{value}</span>
        </label>
    )
}
