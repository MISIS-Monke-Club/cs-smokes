import { MessageModel } from "../../domain/client"
import { UserBadge } from "../user-badge"
import classes from "./message.module.scss"

export function Message({ message }: { message: MessageModel }) {
    return (
        <div className='flex flex-col gap-2.5 p-2.5 bg-[var(--color-background-alt)] rounded-[8px]'>
            <div className='flex flex-row justify-between w-full '>
                <UserBadge user={message.creator} />
                <p className={classes.role}>{message.creator.role}</p>
            </div>
            <p className={classes.message}>{message.text}</p>
        </div>
    )
}
