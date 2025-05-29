import { RequestUser } from "../domain/client"
import { ImageComponent } from "@shared/ui/image"

type UserBadgeProps = {
    user: RequestUser
}

export function UserBadge({ user }: UserBadgeProps) {
    return (
        <div className='flex flex-row items-center gap-2.5'>
            <ImageComponent
                className='rounded-full'
                url={user.avatarUrl}
                alt={`${user.username} (username) avatar image`}
                width={27}
                height={27}
            />
        </div>
    )
}
