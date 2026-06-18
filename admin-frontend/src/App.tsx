import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    LogOut,
    MessageSquare,
    Shield,
    Users,
} from "lucide-react"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"

import {
    approvePullRequest,
    cancelPullRequest,
    createComment,
    deleteComment,
    AdminUser,
    errorMessage,
    fetchMe,
    fetchPullRequestDetail,
    fetchPullRequests,
    fetchUsers,
    isAuthFailure,
    login,
    PullRequestDetail,
    PullRequestSummary,
    rejectPullRequest,
    setUserRoles,
} from "./api"
import {
    AdminMe,
    AdminRole,
    canDeleteComment,
    canGrantRoles,
    canManageUsers,
    canModeratePullRequests,
    clearSession,
    readSession,
    roleLabel,
    writeSession,
} from "./session"

type LoadState = "idle" | "loading" | "ready" | "error"

export function App() {
    const [token, setToken] = useState(() => readSession()?.token ?? "")
    const [me, setMe] = useState<AdminMe | null>(null)
    const [requests, setRequests] = useState<PullRequestSummary[]>([])
    const [users, setUsers] = useState<AdminUser[]>([])
    const [selectedID, setSelectedID] = useState<number | null>(null)
    const [detail, setDetail] = useState<PullRequestDetail | null>(null)
    const [commentText, setCommentText] = useState("")
    const [loadState, setLoadState] = useState<LoadState>("idle")
    const [message, setMessage] = useState("")

    const resetSession = useCallback(() => {
        clearSession()
        setToken("")
        setMe(null)
        setRequests([])
    }, [])

    const loadAdminData = useCallback(async () => {
        if (!token) {
            return
        }
        setLoadState("loading")
        setMessage("")
        try {
            const [adminUser, pullRequests] = await Promise.all([fetchMe(token), fetchPullRequests(token)])
            const adminUsers = canManageUsers(adminUser) ? await fetchUsers(token) : []
            setMe(adminUser)
            setRequests(pullRequests)
            setUsers(adminUsers)
            setSelectedID((current) => current ?? pullRequests[0]?.id ?? null)
            setLoadState("ready")
        } catch (error) {
            if (isAuthFailure(error)) {
                resetSession()
                setMessage("Session expired or this account is not allowed to use admin.")
            } else {
                setLoadState("error")
                setMessage(errorMessage(error))
            }
        }
    }, [resetSession, token])

    useEffect(() => {
        void loadAdminData()
    }, [loadAdminData])

    const loadDetail = useCallback(async () => {
        if (!token || selectedID == null) {
            setDetail(null)
            return
        }
        try {
            setDetail(await fetchPullRequestDetail(token, selectedID))
        } catch (error) {
            if (isAuthFailure(error)) {
                resetSession()
                setMessage("Session expired or this account is not allowed to use admin.")
            } else {
                setMessage(errorMessage(error))
            }
        }
    }, [resetSession, selectedID, token])

    useEffect(() => {
        void loadDetail()
    }, [loadDetail])

    const stats = useMemo(() => {
        const open = requests.filter((request) => request.status === "OPEN").length
        const closed = requests.length - open
        return { open, closed, total: requests.length }
    }, [requests])

    if (!token) {
        return <LoginScreen message={message} onLogin={setToken} />
    }

    return (
        <main className="admin-shell">
            <aside className="sidebar">
                <div className="brand">
                    <Shield aria-hidden="true" />
                    <div>
                        <strong>CS Smokes</strong>
                        <span>Admin</span>
                    </div>
                </div>
                <nav className="nav-list" aria-label="Admin sections">
                    <a className="active" href="#moderation">
                        <Clock3 aria-hidden="true" />
                        Moderation
                    </a>
                    <a className={canManageUsers(me) ? "" : "disabled"} href="#users">
                        <Users aria-hidden="true" />
                        Users
                    </a>
                    <a href="#content">
                        <CheckCircle2 aria-hidden="true" />
                        Content
                    </a>
                    <a href="#comments">
                        <MessageSquare aria-hidden="true" />
                        Comments
                    </a>
                </nav>
                <button className="secondary-action" onClick={resetSession} type="button">
                    <LogOut aria-hidden="true" />
                    Sign out
                </button>
            </aside>
            <section className="workspace">
                <header className="topbar">
                    <div>
                        <h1>Moderation workspace</h1>
                        <p>Review pull requests, manage content, and keep admin roles server-verified.</p>
                    </div>
                    <RolePanel me={me} />
                </header>

                {message && (
                    <div className="notice" role="status">
                        <AlertTriangle aria-hidden="true" />
                        {message}
                    </div>
                )}

                <section className="metric-grid" aria-label="Moderation summary">
                    <Metric label="Open pull requests" value={stats.open} />
                    <Metric label="Closed or merged" value={stats.closed} />
                    <Metric label="Loaded records" value={stats.total} />
                </section>

                <section className="panel" id="moderation">
                    <div className="panel-heading">
                        <div>
                            <h2>Pull requests</h2>
                            <p>Editors can inspect and comment. Base admins and superusers can approve or reject.</p>
                        </div>
                        <button className="secondary-action compact" disabled={loadState === "loading"} onClick={loadAdminData} type="button">
                            Refresh
                        </button>
                    </div>
                    <div className="moderation-grid">
                        <PullRequestTable
                            canApprove={canModeratePullRequests(me)}
                            onApprove={(id) => handleModerationAction(() => approvePullRequest(token, id))}
                            onSelect={setSelectedID}
                            requests={requests}
                            selectedID={selectedID}
                        />
                        <DetailPanel
                            canModerate={canModeratePullRequests(me)}
                            commentText={commentText}
                            detail={detail}
                            me={me}
                            onCancel={(id) => handleModerationAction(() => cancelPullRequest(token, id))}
                            onCommentText={setCommentText}
                            onCreateComment={async (id) => {
                                await handleModerationAction(async () => {
                                    await createComment(token, id, commentText)
                                    setCommentText("")
                                })
                            }}
                            onDeleteComment={(id) => handleModerationAction(() => deleteComment(token, id))}
                            onReject={(id) => handleModerationAction(() => rejectPullRequest(token, id))}
                        />
                    </div>
                </section>

                <section className="split-panels">
                    <div className="panel" id="users">
                        <UsersPanel
                            canGrant={canGrantRoles(me)}
                            canView={canManageUsers(me)}
                            onRolesChange={(userID, roles) =>
                                handleModerationAction(async () => {
                                    await setUserRoles(token, userID, roles)
                                })
                            }
                            users={users}
                        />
                    </div>
                    <div className="panel" id="content">
                        <h2>Content tools</h2>
                        <p>Maps, lineups, grenade classes, properties, and lineup metadata use the same protected API namespace.</p>
                        <span className="status ok">Editor content access</span>
                    </div>
                </section>
            </section>
        </main>
    )

    async function handleModerationAction(action: () => Promise<void>) {
        try {
            setMessage("")
            await action()
            await loadAdminData()
            await loadDetail()
        } catch (error) {
            setMessage(errorMessage(error))
        }
    }
}

function UsersPanel({
    canGrant,
    canView,
    onRolesChange,
    users,
}: {
    canGrant: boolean
    canView: boolean
    onRolesChange: (userID: number, roles: AdminRole[]) => Promise<void>
    users: AdminUser[]
}) {
    if (!canView) {
        return (
            <>
                <h2>User access</h2>
                <p>Editors cannot view or manage users.</p>
                <span className="status muted">Role grants locked</span>
            </>
        )
    }

    return (
        <>
            <div className="panel-heading tight">
                <div>
                    <h2>User access</h2>
                    <p>{canGrant ? "Superusers can grant or revoke roles." : "Base admins can view roles but cannot grant access."}</p>
                </div>
                <span className={canGrant ? "status ok" : "status muted"}>{canGrant ? "Role grants enabled" : "Read only"}</span>
            </div>
            <div className="user-list">
                {users.length === 0 && <p className="hint">No users loaded.</p>}
                {users.map((user) => (
                    <article className="user-row" key={user.user_id}>
                        <div>
                            <strong>{user.username}</strong>
                            <span>#{user.user_id}</span>
                        </div>
                        <RoleCheckboxes canGrant={canGrant} onChange={(roles) => onRolesChange(user.user_id, roles)} roles={user.roles} />
                    </article>
                ))}
            </div>
        </>
    )
}

function RoleCheckboxes({
    canGrant,
    onChange,
    roles,
}: {
    canGrant: boolean
    onChange: (roles: AdminRole[]) => Promise<void>
    roles: AdminRole[]
}) {
    const options: AdminRole[] = ["superuser", "base_admin", "editor"]
    return (
        <div className="role-checkboxes">
            {options.map((role) => {
                const checked = roles.includes(role)
                return (
                    <label key={role}>
                        <input
                            checked={checked}
                            disabled={!canGrant}
                            onChange={() => {
                                const next = checked ? roles.filter((item) => item !== role) : [...roles, role]
                                void onChange(next)
                            }}
                            type="checkbox"
                        />
                        {roleLabel(role)}
                    </label>
                )
            })}
        </div>
    )
}

function LoginScreen({ message, onLogin }: { message: string; onLogin: (token: string) => void }) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(message)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSubmitting(true)
        setError("")
        try {
            const response = await login(username, password)
            writeSession({ token: response.access_token })
            onLogin(response.access_token)
        } catch (requestError) {
            setError(errorMessage(requestError))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="login-screen">
            <section className="login-panel">
                <div className="brand large">
                    <Shield aria-hidden="true" />
                    <div>
                        <strong>CS Smokes</strong>
                        <span>Admin console</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Username or email
                        <input autoComplete="username" onChange={(event) => setUsername(event.target.value)} required value={username} />
                    </label>
                    <label>
                        Password
                        <input
                            autoComplete="current-password"
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            type="password"
                            value={password}
                        />
                    </label>
                    {error && <p className="form-error">{error}</p>}
                    <button disabled={submitting} type="submit">
                        {submitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </section>
        </main>
    )
}

function RolePanel({ me }: { me: AdminMe | null }) {
    return (
        <div className="role-panel">
            <span>User #{me?.user_id ?? "..."}</span>
            <div>
                {me?.roles.map((role) => (
                    <strong key={role}>{roleLabel(role)}</strong>
                ))}
            </div>
        </div>
    )
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="metric">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

function PullRequestTable({
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

function DetailPanel({
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
