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
    errorMessage,
    fetchMe,
    fetchPullRequests,
    isAuthFailure,
    login,
    PullRequestSummary,
} from "./api"
import {
    AdminMe,
    canGrantRoles,
    canManageUsers,
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
            setMe(adminUser)
            setRequests(pullRequests)
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
                    <PullRequestTable
                        canApprove={Boolean(me?.roles.includes("superuser") || me?.roles.includes("base_admin"))}
                        onApprove={async (id) => {
                            await approvePullRequest(token, id)
                            await loadAdminData()
                        }}
                        requests={requests}
                    />
                </section>

                <section className="split-panels">
                    <div className="panel" id="users">
                        <h2>User access</h2>
                        <p>
                            {canManageUsers(me)
                                ? "This role can view users and moderation flags."
                                : "Editors cannot view or manage users."}
                        </p>
                        <span className={canGrantRoles(me) ? "status ok" : "status muted"}>
                            {canGrantRoles(me) ? "Role grants enabled" : "Role grants locked"}
                        </span>
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
    requests,
}: {
    canApprove: boolean
    onApprove: (id: number) => Promise<void>
    requests: PullRequestSummary[]
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
                        <tr key={request.id}>
                            <td data-label="ID">#{request.id}</td>
                            <td data-label="Lineup">{request.lineup.title}</td>
                            <td data-label="Creator">{request.creator.username}</td>
                            <td data-label="Status">
                                <span className={`status ${request.status === "OPEN" ? "warn" : "ok"}`}>{request.status}</span>
                            </td>
                            <td data-label="Created">{new Date(request.created_at).toLocaleDateString()}</td>
                            <td data-label="Action">
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
