import { MessageModel } from "../domain/client"
import { UserBadge } from "./user-badge"

export function Message({ message }: { message: MessageModel }) {
    return (
        <div className='flex flex-col gap-2.5'>
            <div className='flex flex-row justify-between w-full '>
                <UserBadge user={message.creator} />
                <p className='text-[var(--color-accent)]'>роль:</p>
            </div>
            <p>{message.text}</p>
        </div>
    )
}
