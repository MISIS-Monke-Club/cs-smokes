import { useSelector } from "react-redux"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import {
    fromMessagesDTOtoMessageModel,
    Message,
    message_schema,
    PullRequest,
    pullRequestApi,
} from "@entities/pull-request"
import { selectAuthSession } from "@entities/session"
import { client } from "@shared/api"
import { Button } from "@shared/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@shared/ui/dialog"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

export function RequestFeed({ requestId }: { requestId: PullRequest["id"] }) {
    const socketRef = useRef<WebSocket | null>(null)
    const {
        data: feedMessages,
        isError,
        isLoading,
    } = useQuery(pullRequestApi.getMessagesByRequestOptions(requestId))
    const { userId } = useSelector(selectAuthSession)
    const [newMessageText, setNewMessageText] = useState("")

    useEffect(() => {
        const socket = new WebSocket(
            `ws://localhost:3000/ws/api/pull_requests/${requestId}/comments/`
        )

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)

            if (Array.isArray(data)) {
                const parsed = message_schema.array().parse(data)
                client.setQueryData(
                    pullRequestApi.getMessagesByRequestOptions(requestId)
                        .queryKey,
                    fromMessagesDTOtoMessageModel(parsed)
                )
            }
        }

        socketRef.current = socket

        return () => {
            socket.close()
        }
    }, [requestId])

    const handleSendMessage = () => {
        const message = {
            action: "create",
            user_id: userId,
            message: newMessageText,
        }

        socketRef.current?.send(JSON.stringify(message))
        setNewMessageText("")
    }

    if (isLoading) {
        return <div>loading...</div>
    }

    if (isError) {
        return (
            <PlaceholderBlock>
                Something went wrong with messages feed
            </PlaceholderBlock>
        )
    }

    if (!feedMessages) {
        return <PlaceholderBlock>Something went wrong...</PlaceholderBlock>
    }

    return (
        <div className='w-full flex flex-col gap-2.5'>
            <h2>Messages feed</h2>
            <div className='flex flex-col gap-2.5 pb-25'>
                {feedMessages.map((el) => (
                    <Message key={el.id} message={el} />
                ))}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className='w-full text-[var(--color-accent)]'>
                            <Plus
                                style={{
                                    width: 24,
                                    height: 24,
                                }}
                            />
                            Create new message
                        </Button>
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New message</DialogTitle>
                        </DialogHeader>
                        <textarea
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            placeholder='Введите сообщение...'
                            className='w-full border rounded p-2'
                            rows={4}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!newMessageText.trim()}
                                >
                                    Отправить
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
