import { AdminMe, canDeleteComment } from "../../session"
import { PullRequestDetail, PullRequestSummary } from "../../api"

export function PullRequestTable({
    canApprove,
    onApprove,
    onSelect,
    requests,
    selectedID,
}: {
    canApprove: boolean
    onApprove: (id: number) => Promise<void>
    onSelect: (id: number) => void
    requests: PullRequestSummary[]
    selectedID: number | null
}) {
    if (requests.length === 0) {
        return <div className="empty-state">No pull requests loaded.</div>
    }

    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Lineup</th>
                        <th>Creator</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((request) => (
                        <tr className={request.id === selectedID ? "selected-row" : ""} key={request.id}>
                            <td data-label="ID">#{request.id}</td>
                            <td data-label="Lineup">{request.lineup.title}</td>
                            <td data-label="Creator">{request.creator.username}</td>
                            <td data-label="Status">
                                <span className={`status ${request.status === "OPEN" ? "warn" : "ok"}`}>{request.status}</span>
                            </td>
                            <td data-label="Created">{new Date(request.created_at).toLocaleDateString()}</td>
                            <td data-label="Action">
                                <button className="row-action secondary" onClick={() => onSelect(request.id)} type="button">
                                    View
                                </button>
                                <button
                                    className="row-action"
                                    disabled={!canApprove || request.status !== "OPEN"}
                                    onClick={() => void onApprove(request.id)}
                                    type="button"
                                >
                                    Approve
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function DetailPanel({
    canModerate,
    commentText,
    detail,
    me,
    onCancel,
    onCommentText,
    onCreateComment,
    onDeleteComment,
    onReject,
}: {
    canModerate: boolean
    commentText: string
    detail: PullRequestDetail | null
    me: AdminMe | null
    onCancel: (id: number) => Promise<void>
    onCommentText: (text: string) => void
    onCreateComment: (id: number) => Promise<void>
    onDeleteComment: (id: number) => Promise<void>
    onReject: (id: number) => Promise<void>
}) {
    if (!detail) {
        return (
            <aside className="detail-panel">
                <h2>Pull request detail</h2>
                <p>Select a pull request to inspect comments and moderation controls.</p>
            </aside>
        )
    }
    const request = detail.pull_request

    return (
        <aside className="detail-panel">
            <div className="detail-heading">
                <div>
                    <span className="eyeless-label">PR #{request.id}</span>
                    <h2>{request.lineup.title}</h2>
                </div>
                <span className={`status ${request.status === "OPEN" ? "warn" : "ok"}`}>{request.status}</span>
            </div>
            <div className="button-row">
                <button disabled={!canModerate || request.status !== "OPEN"} onClick={() => void onReject(request.id)} type="button">
                    Reject
                </button>
                <button disabled={!canModerate || request.status !== "OPEN"} onClick={() => void onCancel(request.id)} type="button">
                    Cancel
                </button>
            </div>
            {!canModerate && <p className="hint">Editors can comment, but approval, rejection, and cancellation are locked.</p>}
            <section className="comments-panel" id="comments">
                <h3>Comments</h3>
                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        if (commentText.trim()) {
                            void onCreateComment(request.id)
                        }
                    }}
                >
                    <textarea
                        onChange={(event) => onCommentText(event.target.value)}
                        placeholder="Write moderation feedback"
                        value={commentText}
                    />
                    <button disabled={!commentText.trim()} type="submit">
                        Add comment
                    </button>
                </form>
                <div className="comment-list">
                    {detail.comments.length === 0 && <p className="hint">No comments yet.</p>}
                    {detail.comments.map((comment) => (
                        <article className="comment-item" key={comment.id}>
                            <div>
                                <strong>{comment.creator.username}</strong>
                                <span>{comment.creator.role}</span>
                            </div>
                            <p>{comment.text}</p>
                            {canDeleteComment(me, comment) && (
                                <button className="link-action" onClick={() => void onDeleteComment(comment.id)} type="button">
                                    Delete
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            </section>
        </aside>
    )
}
