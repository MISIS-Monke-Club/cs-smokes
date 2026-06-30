import { AdminUser } from "../../api"
import { AdminRole, roleLabel } from "../../session"

export function UsersPanel({
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
