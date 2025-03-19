import React from "react"
import { UserModel } from "../userSchema"
import { ProfileField } from "../profileField/profileField"
import classes from "./userProfile.module.scss"

type UserProfileProps = {
    user: UserModel
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    return (
        <div className={classes.profile}>
            <ProfileField label='ID' value={user.user_id} />
            <ProfileField label='Nickname' value={user.username} />
            <ProfileField label='Name' value={user.first_name} />
            <ProfileField label='Last Name' value={user.last_name} />
            <ProfileField label='Email' value={user.email} />
            <ProfileField label='Steam' value={user.steam_link} />
            <ProfileField label='Telegram' value={user.tg_id} />
            <ProfileField
                label='Is Banned'
                value={user.is_banned ? "Yes" : "No"}
            />
        </div>
    )
}
