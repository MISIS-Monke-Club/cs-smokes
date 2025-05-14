import React from "react"
import { UserModel } from "../../model/domain"
import { ProfileField } from "../profile-field/profile-field"
import classes from "./user-profile.module.scss"
import { ImageComponent } from "@shared/ui/image"

type UserProfileProps = {
    user: UserModel
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    return (
        <div className={classes.profile}>
            <ImageComponent
                url={
                    user?.avatarUrl
                        ? user.avatarUrl
                        : "/@public/defaultProfileImg.png"
                }
                className={classes.avatar}
                skeletonClasses={classes.skeleton}
                isLoading={false}
                width={310}
                height={310}
            />
            <div className={classes.main}>
                <h2 className={classes.mainTitle}>Main information</h2>
                <ProfileField
                    label='name'
                    value={user?.firstName ? user.firstName : "no firstName"}
                />
                <ProfileField
                    label='email'
                    value={user?.email ? user.email : "no email"}
                />
            </div>
            <div className={classes.connections}>
                <h2 className={classes.connectionsTitle}>Connections</h2>
                <ProfileField
                    label='steam link'
                    value={user?.steamLink ? user.steamLink : "no steam link"}
                />
                <ProfileField
                    label='tg id'
                    value={user?.tgId ? user.tgId : "no tg id"}
                />
            </div>
        </div>
    )
}
