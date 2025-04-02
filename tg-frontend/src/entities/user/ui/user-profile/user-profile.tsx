import React from "react"
import { UserModel } from "../../model/domain"
import { ProfileField } from "../profile-field"
import classes from "./user-profile.module.scss"

type UserProfileProps = {
    user: UserModel
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    return (
        <div className={classes.profile}>
            <ProfileField label='ID' value={user.userId} />
            <ProfileField label='Nickname' value={user.username} />
            <ProfileField label='Name' value={user.firstName} />
            <ProfileField label='Last Name' value={user.lastName} />
            <ProfileField label='Email' value={user.email} />
            <ProfileField label='Steam' value={user.steamLink} />
            <ProfileField label='Telegram' value={user.tgId} />
            <ProfileField
                label='Is Banned'
                value={user.isBanned ? "Yes" : "No"}
            />
        </div>
    )
}
