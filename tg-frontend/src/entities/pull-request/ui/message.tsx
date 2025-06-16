import { MessageModel } from "../domain/client"
import { UserBadge } from "./user-badge"

export function Message({ message }: { message: MessageModel }) {
    return (
        <div className='flex flex-col gap-2.5 p-2.5 bg-[var(--color-background-alt)]'>
            <div className='flex flex-row justify-between w-full '>
                <UserBadge user={message.creator} />
                {message.creator.role}
            </div>
            <p>{message.text}</p>
        </div>
    )
}
