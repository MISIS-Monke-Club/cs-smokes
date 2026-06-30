import { Shield } from "lucide-react"
import { FormEvent, useState } from "react"

import { errorMessage, login } from "../../api"
import { AdminMe, roleLabel, writeSession } from "../../session"

export function LoginScreen({ message, onLogin }: { message: string; onLogin: (token: string) => void }) {
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

export function RolePanel({ me }: { me: AdminMe | null }) {
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
