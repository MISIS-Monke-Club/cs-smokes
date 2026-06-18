import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    LogOut,
    MessageSquare,
    Shield,
    Users,
} from "lucide-react"
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react"

import {
    AdminGrenadeClass,
    AdminLineup,
    AdminMap,
    AdminProperty,
    AdminPropertyRelation,
    approvePullRequest,
    cancelPullRequest,
    createGrenadeClass,
    createLineup,
    createComment,
    createMap,
    createProperty,
    createPropertyRelation,
    deleteGrenadeClass,
    deleteLineup,
    deleteComment,
    deleteMap,
    deleteProperty,
    deletePropertyRelation,
    AdminUser,
    errorMessage,
    fetchGrenadeClasses,
    fetchLineups,
    fetchMaps,
    fetchMe,
    fetchProperties,
    fetchPropertyRelations,
    fetchPullRequestDetail,
    fetchPullRequests,
    fetchUsers,
    isAuthFailure,
    login,
    PullRequestDetail,
    PullRequestSummary,
    rejectPullRequest,
    setUserRoles,
    updateGrenadeClass,
    updateLineup,
    updateMap,
    updateProperty,
} from "./api"
import {
    classInputFromForm,
    ClassFormState,
    emptyClassForm,
    emptyMapForm,
    emptyPropertyForm,
    mapInputFromForm,
    MapFormState,
    propertyInputFromForm,
    PropertyFormState,
} from "./catalog"
import { canManageContent, emptyLineupForm, lineupFormFromLineup, lineupInputFromForm, LineupFormState } from "./lineups"
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
type ApprovedFilter = "all" | "approved" | "pending"
type LineupFiltersState = {
    approved: ApprovedFilter
    ordering: "date_of_creation" | "-date_of_creation" | "by_alphabet" | "-by_alphabet"
    query: string
}
type MapPoolFilter = "all" | "active" | "reserve"
type MapFiltersState = {
    ordering: "quantity" | "-quantity" | "by_alphabet" | "-by_alphabet"
    pool: MapPoolFilter
    query: string
}
type RelationFormState = {
    grenadeID: string
    propertyID: string
}

export function App() {
    const [token, setToken] = useState(() => readSession()?.token ?? "")
    const [me, setMe] = useState<AdminMe | null>(null)
    const [requests, setRequests] = useState<PullRequestSummary[]>([])
    const [users, setUsers] = useState<AdminUser[]>([])
    const [lineups, setLineups] = useState<AdminLineup[]>([])
    const [lineupFilters, setLineupFilters] = useState<LineupFiltersState>({ approved: "all", ordering: "-date_of_creation", query: "" })
    const [selectedLineupID, setSelectedLineupID] = useState<number | null>(null)
    const [editingLineupID, setEditingLineupID] = useState<number | null>(null)
    const [lineupForm, setLineupForm] = useState<LineupFormState>(emptyLineupForm)
    const [maps, setMaps] = useState<AdminMap[]>([])
    const [mapFilters, setMapFilters] = useState<MapFiltersState>({ ordering: "by_alphabet", pool: "all", query: "" })
    const [mapForm, setMapForm] = useState<MapFormState>(emptyMapForm)
    const [editingMapID, setEditingMapID] = useState<number | null>(null)
    const [grenadeClasses, setGrenadeClasses] = useState<AdminGrenadeClass[]>([])
    const [classForm, setClassForm] = useState<ClassFormState>(emptyClassForm)
    const [editingClassID, setEditingClassID] = useState<number | null>(null)
    const [properties, setProperties] = useState<AdminProperty[]>([])
    const [propertyForm, setPropertyForm] = useState<PropertyFormState>(emptyPropertyForm)
    const [editingPropertyID, setEditingPropertyID] = useState<number | null>(null)
    const [propertyRelations, setPropertyRelations] = useState<AdminPropertyRelation[]>([])
    const [relationForm, setRelationForm] = useState<RelationFormState>({ grenadeID: "", propertyID: "" })
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
        setUsers([])
        setLineups([])
        setMaps([])
        setGrenadeClasses([])
        setProperties([])
        setPropertyRelations([])
        setDetail(null)
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
            const contentAllowed = canManageContent(adminUser)
            const [adminLineups, adminMaps, adminClasses, adminProperties, adminRelations] = contentAllowed
                ? await Promise.all([
                      fetchLineups(token, {
                          isApproved: approvedFilterValue(lineupFilters.approved),
                          ordering: lineupFilters.ordering,
                          query: lineupFilters.query.trim() || undefined,
                      }),
                      fetchMaps(token, {
                          isEsportsPool: mapPoolFilterValue(mapFilters.pool),
                          ordering: mapFilters.ordering,
                          query: mapFilters.query.trim() || undefined,
                      }),
                      fetchGrenadeClasses(token),
                      fetchProperties(token),
                      fetchPropertyRelations(token, relationForm.grenadeID.trim() ? Number(relationForm.grenadeID.trim()) : undefined),
                  ])
                : [[], [], [], [], []]
            setMe(adminUser)
            setRequests(pullRequests)
            setUsers(adminUsers)
            setLineups(adminLineups)
            setMaps(adminMaps)
            setGrenadeClasses(adminClasses)
            setProperties(adminProperties)
            setPropertyRelations(adminRelations)
            setSelectedID((current) => current ?? pullRequests[0]?.id ?? null)
            setSelectedLineupID((current) =>
                current != null && adminLineups.some((lineup) => lineup.grenade_id === current) ? current : (adminLineups[0]?.grenade_id ?? null),
            )
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
    }, [
        lineupFilters.approved,
        lineupFilters.ordering,
        lineupFilters.query,
        mapFilters.ordering,
        mapFilters.pool,
        mapFilters.query,
        relationForm.grenadeID,
        resetSession,
        token,
    ])

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
    const selectedLineup = useMemo(
        () => lineups.find((lineup) => lineup.grenade_id === selectedLineupID) ?? null,
        [lineups, selectedLineupID],
    )

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

                <section className="panel follow-panel" id="users">
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
                </section>

                <section className="panel follow-panel" id="content">
                    <LineupsPanel
                        canManage={canManageContent(me)}
                        editingID={editingLineupID}
                        filters={lineupFilters}
                        form={lineupForm}
                        lineups={lineups}
                        onDelete={(id) => handleModerationAction(() => deleteLineup(token, id))}
                        onEdit={(lineup) => {
                            setSelectedLineupID(lineup.grenade_id)
                            setEditingLineupID(lineup.grenade_id)
                            setLineupForm(lineupFormFromLineup(lineup))
                        }}
                        onFiltersChange={setLineupFilters}
                        onFormChange={setLineupForm}
                        onNew={() => {
                            setEditingLineupID(null)
                            setLineupForm(emptyLineupForm)
                        }}
                        onSelect={setSelectedLineupID}
                        onSubmit={async () => {
                            await handleModerationAction(async () => {
                                const input = lineupInputFromForm(lineupForm)
                                if (editingLineupID == null) {
                                    await createLineup(token, input)
                                } else {
                                    await updateLineup(token, editingLineupID, input)
                                }
                                setEditingLineupID(null)
                                setLineupForm(emptyLineupForm)
                            })
                        }}
                        selectedLineup={selectedLineup}
                    />
                </section>

                <section className="panel follow-panel" id="catalog">
                    <CatalogPanel
                        canManage={canManageContent(me)}
                        classForm={classForm}
                        editingClassID={editingClassID}
                        editingMapID={editingMapID}
                        editingPropertyID={editingPropertyID}
                        grenadeClasses={grenadeClasses}
                        mapFilters={mapFilters}
                        mapForm={mapForm}
                        maps={maps}
                        onClassDelete={(id) => handleModerationAction(() => deleteGrenadeClass(token, id))}
                        onClassEdit={(item) => {
                            setEditingClassID(item.grenade_class_id)
                            setClassForm({ description: item.description ?? "", name: item.name, price: String(item.price) })
                        }}
                        onClassFormChange={setClassForm}
                        onClassNew={() => {
                            setEditingClassID(null)
                            setClassForm(emptyClassForm)
                        }}
                        onClassSubmit={() =>
                            handleModerationAction(async () => {
                                const input = classInputFromForm(classForm)
                                if (editingClassID == null) {
                                    await createGrenadeClass(token, input)
                                } else {
                                    await updateGrenadeClass(token, editingClassID, input)
                                }
                                setEditingClassID(null)
                                setClassForm(emptyClassForm)
                            })
                        }
                        onMapDelete={(id) => handleModerationAction(() => deleteMap(token, id))}
                        onMapEdit={(item) => {
                            setEditingMapID(item.map_id)
                            setMapForm({ image: undefined, isEsportsPool: item.is_esports_pool, link: item.link ?? "", name: item.name })
                        }}
                        onMapFiltersChange={setMapFilters}
                        onMapFormChange={setMapForm}
                        onMapNew={() => {
                            setEditingMapID(null)
                            setMapForm(emptyMapForm)
                        }}
                        onMapSubmit={() =>
                            handleModerationAction(async () => {
                                const input = mapInputFromForm(mapForm)
                                if (editingMapID == null) {
                                    await createMap(token, input)
                                } else {
                                    await updateMap(token, editingMapID, input)
                                }
                                setEditingMapID(null)
                                setMapForm(emptyMapForm)
                            })
                        }
                        onPropertyDelete={(id) => handleModerationAction(() => deleteProperty(token, id))}
                        onPropertyEdit={(item) => {
                            setEditingPropertyID(item.property_id)
                            setPropertyForm({ name: item.name, value: item.value ?? "" })
                        }}
                        onPropertyFormChange={setPropertyForm}
                        onPropertyNew={() => {
                            setEditingPropertyID(null)
                            setPropertyForm(emptyPropertyForm)
                        }}
                        onPropertySubmit={() =>
                            handleModerationAction(async () => {
                                const input = propertyInputFromForm(propertyForm)
                                if (editingPropertyID == null) {
                                    await createProperty(token, input)
                                } else {
                                    await updateProperty(token, editingPropertyID, input)
                                }
                                setEditingPropertyID(null)
                                setPropertyForm(emptyPropertyForm)
                            })
                        }
                        onRelationDelete={(grenadeID, propertyID) => handleModerationAction(() => deletePropertyRelation(token, grenadeID, propertyID))}
                        onRelationFormChange={setRelationForm}
                        onRelationSubmit={() =>
                            handleModerationAction(async () => {
                                await createPropertyRelation(token, Number(relationForm.grenadeID), Number(relationForm.propertyID))
                                setRelationForm({ ...relationForm, propertyID: "" })
                            })
                        }
                        properties={properties}
                        propertyForm={propertyForm}
                        propertyRelations={propertyRelations}
                        relationForm={relationForm}
                    />
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

function LineupsPanel({
    canManage,
    editingID,
    filters,
    form,
    lineups,
    onDelete,
    onEdit,
    onFiltersChange,
    onFormChange,
    onNew,
    onSelect,
    onSubmit,
    selectedLineup,
}: {
    canManage: boolean
    editingID: number | null
    filters: LineupFiltersState
    form: LineupFormState
    lineups: AdminLineup[]
    onDelete: (id: number) => Promise<void>
    onEdit: (lineup: AdminLineup) => void
    onFiltersChange: (filters: LineupFiltersState) => void
    onFormChange: (form: LineupFormState) => void
    onNew: () => void
    onSelect: (id: number) => void
    onSubmit: () => Promise<void>
    selectedLineup: AdminLineup | null
}) {
    return (
        <>
            <div className="panel-heading tight">
                <div>
                    <h2>Lineups</h2>
                    <p>Filter, inspect derived fields, and manage lineup records through the protected admin API.</p>
                </div>
                <span className={canManage ? "status ok" : "status muted"}>{canManage ? "Editor content access" : "Content locked"}</span>
            </div>
            <div className="lineup-tools">
                <label>
                    Search
                    <input
                        disabled={!canManage}
                        onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
                        placeholder="Title or description"
                        value={filters.query}
                    />
                </label>
                <label>
                    Approval
                    <select
                        disabled={!canManage}
                        onChange={(event) => onFiltersChange({ ...filters, approved: event.target.value as ApprovedFilter })}
                        value={filters.approved}
                    >
                        <option value="all">All</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                    </select>
                </label>
                <label>
                    Sort
                    <select
                        disabled={!canManage}
                        onChange={(event) => onFiltersChange({ ...filters, ordering: event.target.value as LineupFiltersState["ordering"] })}
                        value={filters.ordering}
                    >
                        <option value="-date_of_creation">Newest</option>
                        <option value="date_of_creation">Oldest</option>
                        <option value="by_alphabet">A-Z</option>
                        <option value="-by_alphabet">Z-A</option>
                    </select>
                </label>
            </div>
            <div className="lineup-grid">
                <div className="table-wrap compact-table">
                    {lineups.length === 0 ? (
                        <div className="empty-state">No lineups loaded.</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineups.map((lineup) => (
                                    <tr className={lineup.grenade_id === selectedLineup?.grenade_id ? "selected-row" : ""} key={lineup.grenade_id}>
                                        <td data-label="ID">#{lineup.grenade_id}</td>
                                        <td data-label="Title">{lineup.title}</td>
                                        <td data-label="Status">
                                            <span className={`status ${lineup.is_approved ? "ok" : "warn"}`}>
                                                {lineup.is_approved ? "Approved" : "Pending"}
                                            </span>
                                        </td>
                                        <td data-label="Action">
                                            <button className="row-action secondary" onClick={() => onSelect(lineup.grenade_id)} type="button">
                                                View
                                            </button>
                                            <button className="row-action" disabled={!canManage} onClick={() => onEdit(lineup)} type="button">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <LineupDetail canManage={canManage} lineup={selectedLineup} onDelete={onDelete} onEdit={onEdit} />
            </div>
            <LineupForm canManage={canManage} editingID={editingID} form={form} onChange={onFormChange} onNew={onNew} onSubmit={onSubmit} />
        </>
    )
}

function LineupDetail({
    canManage,
    lineup,
    onDelete,
    onEdit,
}: {
    canManage: boolean
    lineup: AdminLineup | null
    onDelete: (id: number) => Promise<void>
    onEdit: (lineup: AdminLineup) => void
}) {
    if (!lineup) {
        return <aside className="detail-panel compact-detail">Select a lineup to inspect metadata.</aside>
    }

    return (
        <aside className="detail-panel compact-detail">
            <div className="detail-heading">
                <div>
                    <span className="eyeless-label">Lineup #{lineup.grenade_id}</span>
                    <h2>{lineup.title}</h2>
                </div>
                <span className={`status ${lineup.is_approved ? "ok" : "warn"}`}>{lineup.is_approved ? "Approved" : "Pending"}</span>
            </div>
            <dl className="derived-list">
                <div>
                    <dt>Creator</dt>
                    <dd>
                        {lineup.creator.username} #{lineup.user_id}
                    </dd>
                </div>
                <div>
                    <dt>Map</dt>
                    <dd>#{lineup.map_id}</dd>
                </div>
                <div>
                    <dt>Grenade class</dt>
                    <dd>
                        {lineup.grenade_class.name} · ${lineup.grenade_class.price}
                    </dd>
                </div>
                <div>
                    <dt>Views</dt>
                    <dd>{lineup.views}</dd>
                </div>
                <div>
                    <dt>Request</dt>
                    <dd>{lineup.request.status}</dd>
                </div>
                <div>
                    <dt>Properties</dt>
                    <dd>{lineup.property_list.length ? lineup.property_list.map((item) => `${item.name}${item.value ? `: ${item.value}` : ""}`).join(", ") : "None"}</dd>
                </div>
            </dl>
            {lineup.description && <p>{lineup.description}</p>}
            {lineup.link_to_video && (
                <a className="link-action" href={lineup.link_to_video} rel="noreferrer" target="_blank">
                    Open video
                </a>
            )}
            <div className="button-row">
                <button disabled={!canManage} onClick={() => onEdit(lineup)} type="button">
                    Edit
                </button>
                <button className="danger-action" disabled={!canManage} onClick={() => void onDelete(lineup.grenade_id)} type="button">
                    Delete
                </button>
            </div>
        </aside>
    )
}

function LineupForm({
    canManage,
    editingID,
    form,
    onChange,
    onNew,
    onSubmit,
}: {
    canManage: boolean
    editingID: number | null
    form: LineupFormState
    onChange: (form: LineupFormState) => void
    onNew: () => void
    onSubmit: () => Promise<void>
}) {
    return (
        <form
            className="lineup-form"
            onSubmit={(event) => {
                event.preventDefault()
                void onSubmit()
            }}
        >
            <div className="form-heading">
                <div>
                    <h3>{editingID == null ? "Create lineup" : `Edit lineup #${editingID}`}</h3>
                    <p>IDs map directly to backend validation fields.</p>
                </div>
                <button className="secondary-action compact" onClick={onNew} type="button">
                    New
                </button>
            </div>
            <div className="form-grid">
                <label>
                    Title
                    <input disabled={!canManage} onChange={(event) => onChange({ ...form, title: event.target.value })} required value={form.title} />
                </label>
                <label>
                    Map ID
                    <input disabled={!canManage} onChange={(event) => onChange({ ...form, mapID: event.target.value })} required value={form.mapID} />
                </label>
                <label>
                    Creator user ID
                    <input disabled={!canManage} onChange={(event) => onChange({ ...form, userID: event.target.value })} required value={form.userID} />
                </label>
                <label>
                    Grenade class ID
                    <input
                        disabled={!canManage}
                        onChange={(event) => onChange({ ...form, grenadeClassID: event.target.value })}
                        required
                        value={form.grenadeClassID}
                    />
                </label>
                <label>
                    Views
                    <input disabled={!canManage} onChange={(event) => onChange({ ...form, views: event.target.value })} value={form.views} />
                </label>
                <label className="checkbox-label">
                    <input
                        checked={form.isApproved}
                        disabled={!canManage}
                        onChange={(event) => onChange({ ...form, isApproved: event.target.checked })}
                        type="checkbox"
                    />
                    Approved
                </label>
            </div>
            <label>
                Video URL
                <input disabled={!canManage} onChange={(event) => onChange({ ...form, linkToVideo: event.target.value })} value={form.linkToVideo} />
            </label>
            <label>
                Description
                <textarea disabled={!canManage} onChange={(event) => onChange({ ...form, description: event.target.value })} value={form.description} />
            </label>
            <button disabled={!canManage} type="submit">
                {editingID == null ? "Create lineup" : "Save lineup"}
            </button>
        </form>
    )
}

function approvedFilterValue(value: ApprovedFilter): boolean | undefined {
    switch (value) {
        case "approved":
            return true
        case "pending":
            return false
        case "all":
            return undefined
    }
}

function mapPoolFilterValue(value: MapPoolFilter): boolean | undefined {
    switch (value) {
        case "active":
            return true
        case "reserve":
            return false
        case "all":
            return undefined
    }
}

function CatalogPanel({
    canManage,
    classForm,
    editingClassID,
    editingMapID,
    editingPropertyID,
    grenadeClasses,
    mapFilters,
    mapForm,
    maps,
    onClassDelete,
    onClassEdit,
    onClassFormChange,
    onClassNew,
    onClassSubmit,
    onMapDelete,
    onMapEdit,
    onMapFiltersChange,
    onMapFormChange,
    onMapNew,
    onMapSubmit,
    onPropertyDelete,
    onPropertyEdit,
    onPropertyFormChange,
    onPropertyNew,
    onPropertySubmit,
    onRelationDelete,
    onRelationFormChange,
    onRelationSubmit,
    properties,
    propertyForm,
    propertyRelations,
    relationForm,
}: {
    canManage: boolean
    classForm: ClassFormState
    editingClassID: number | null
    editingMapID: number | null
    editingPropertyID: number | null
    grenadeClasses: AdminGrenadeClass[]
    mapFilters: MapFiltersState
    mapForm: MapFormState
    maps: AdminMap[]
    onClassDelete: (id: number) => Promise<void>
    onClassEdit: (item: AdminGrenadeClass) => void
    onClassFormChange: (form: ClassFormState) => void
    onClassNew: () => void
    onClassSubmit: () => Promise<void>
    onMapDelete: (id: number) => Promise<void>
    onMapEdit: (item: AdminMap) => void
    onMapFiltersChange: (filters: MapFiltersState) => void
    onMapFormChange: (form: MapFormState) => void
    onMapNew: () => void
    onMapSubmit: () => Promise<void>
    onPropertyDelete: (id: number) => Promise<void>
    onPropertyEdit: (item: AdminProperty) => void
    onPropertyFormChange: (form: PropertyFormState) => void
    onPropertyNew: () => void
    onPropertySubmit: () => Promise<void>
    onRelationDelete: (grenadeID: number, propertyID: number) => Promise<void>
    onRelationFormChange: (form: RelationFormState) => void
    onRelationSubmit: () => Promise<void>
    properties: AdminProperty[]
    propertyForm: PropertyFormState
    propertyRelations: AdminPropertyRelation[]
    relationForm: RelationFormState
}) {
    return (
        <>
            <div className="panel-heading tight">
                <div>
                    <h2>Catalog</h2>
                    <p>Maps, grenade classes, properties, media fields, and lineup property links.</p>
                </div>
                <span className={canManage ? "status ok" : "status muted"}>{canManage ? "Catalog access" : "Catalog locked"}</span>
            </div>
            <section className="catalog-grid">
                <CatalogCard title="Maps">
                    <div className="lineup-tools">
                        <label>
                            Search
                            <input
                                disabled={!canManage}
                                onChange={(event) => onMapFiltersChange({ ...mapFilters, query: event.target.value })}
                                value={mapFilters.query}
                            />
                        </label>
                        <label>
                            Pool
                            <select
                                disabled={!canManage}
                                onChange={(event) => onMapFiltersChange({ ...mapFilters, pool: event.target.value as MapPoolFilter })}
                                value={mapFilters.pool}
                            >
                                <option value="all">All</option>
                                <option value="active">Esports pool</option>
                                <option value="reserve">Reserve</option>
                            </select>
                        </label>
                        <label>
                            Sort
                            <select
                                disabled={!canManage}
                                onChange={(event) => onMapFiltersChange({ ...mapFilters, ordering: event.target.value as MapFiltersState["ordering"] })}
                                value={mapFilters.ordering}
                            >
                                <option value="by_alphabet">A-Z</option>
                                <option value="-by_alphabet">Z-A</option>
                                <option value="-quantity">Most lineups</option>
                                <option value="quantity">Fewest lineups</option>
                            </select>
                        </label>
                    </div>
                    <SimpleTable
                        columns={["ID", "Name", "Pool", "Action"]}
                        rows={maps.map((item) => ({
                            action: (
                                <RowActions
                                    canManage={canManage}
                                    onDelete={() => onMapDelete(item.map_id)}
                                    onEdit={() => onMapEdit(item)}
                                />
                            ),
                            cells: [`#${item.map_id}`, item.name, item.is_esports_pool ? "Esports" : "Reserve"],
                            key: item.map_id,
                        }))}
                    />
                    <form className="catalog-form" onSubmit={(event) => submitForm(event, onMapSubmit)}>
                        <FormHeading onNew={onMapNew} title={editingMapID == null ? "Create map" : `Edit map #${editingMapID}`} />
                        <label>
                            Name
                            <input disabled={!canManage} onChange={(event) => onMapFormChange({ ...mapForm, name: event.target.value })} required value={mapForm.name} />
                        </label>
                        <label>
                            Link
                            <input disabled={!canManage} onChange={(event) => onMapFormChange({ ...mapForm, link: event.target.value })} value={mapForm.link} />
                        </label>
                        <label>
                            Image
                            <input
                                disabled={!canManage}
                                onChange={(event) => onMapFormChange({ ...mapForm, image: event.target.files?.[0] })}
                                type="file"
                            />
                        </label>
                        <label className="checkbox-label">
                            <input
                                checked={mapForm.isEsportsPool}
                                disabled={!canManage}
                                onChange={(event) => onMapFormChange({ ...mapForm, isEsportsPool: event.target.checked })}
                                type="checkbox"
                            />
                            Esports pool
                        </label>
                        <button disabled={!canManage} type="submit">{editingMapID == null ? "Create map" : "Save map"}</button>
                    </form>
                </CatalogCard>

                <CatalogCard title="Grenade classes">
                    <SimpleTable
                        columns={["ID", "Name", "Price", "Action"]}
                        rows={grenadeClasses.map((item) => ({
                            action: <RowActions canManage={canManage} onDelete={() => onClassDelete(item.grenade_class_id)} onEdit={() => onClassEdit(item)} />,
                            cells: [`#${item.grenade_class_id}`, item.name, `$${item.price}`],
                            key: item.grenade_class_id,
                        }))}
                    />
                    <form className="catalog-form" onSubmit={(event) => submitForm(event, onClassSubmit)}>
                        <FormHeading onNew={onClassNew} title={editingClassID == null ? "Create class" : `Edit class #${editingClassID}`} />
                        <label>
                            Name
                            <input disabled={!canManage} onChange={(event) => onClassFormChange({ ...classForm, name: event.target.value })} required value={classForm.name} />
                        </label>
                        <label>
                            Price
                            <input disabled={!canManage} onChange={(event) => onClassFormChange({ ...classForm, price: event.target.value })} value={classForm.price} />
                        </label>
                        <label>
                            Description
                            <textarea disabled={!canManage} onChange={(event) => onClassFormChange({ ...classForm, description: event.target.value })} value={classForm.description} />
                        </label>
                        <button disabled={!canManage} type="submit">{editingClassID == null ? "Create class" : "Save class"}</button>
                    </form>
                </CatalogCard>

                <CatalogCard title="Properties">
                    <SimpleTable
                        columns={["ID", "Name", "Value", "Action"]}
                        rows={properties.map((item) => ({
                            action: <RowActions canManage={canManage} onDelete={() => onPropertyDelete(item.property_id)} onEdit={() => onPropertyEdit(item)} />,
                            cells: [`#${item.property_id}`, item.name, item.value ?? ""],
                            key: item.property_id,
                        }))}
                    />
                    <form className="catalog-form" onSubmit={(event) => submitForm(event, onPropertySubmit)}>
                        <FormHeading onNew={onPropertyNew} title={editingPropertyID == null ? "Create property" : `Edit property #${editingPropertyID}`} />
                        <label>
                            Name
                            <input disabled={!canManage} onChange={(event) => onPropertyFormChange({ ...propertyForm, name: event.target.value })} required value={propertyForm.name} />
                        </label>
                        <label>
                            Value
                            <input disabled={!canManage} onChange={(event) => onPropertyFormChange({ ...propertyForm, value: event.target.value })} value={propertyForm.value} />
                        </label>
                        <button disabled={!canManage} type="submit">{editingPropertyID == null ? "Create property" : "Save property"}</button>
                    </form>
                </CatalogCard>

                <CatalogCard title="Property links">
                    <form className="catalog-form compact" onSubmit={(event) => submitForm(event, onRelationSubmit)}>
                        <label>
                            Lineup ID
                            <input
                                disabled={!canManage}
                                onChange={(event) => onRelationFormChange({ ...relationForm, grenadeID: event.target.value })}
                                required
                                value={relationForm.grenadeID}
                            />
                        </label>
                        <label>
                            Property ID
                            <input
                                disabled={!canManage}
                                onChange={(event) => onRelationFormChange({ ...relationForm, propertyID: event.target.value })}
                                required
                                value={relationForm.propertyID}
                            />
                        </label>
                        <button disabled={!canManage} type="submit">Link property</button>
                    </form>
                    <SimpleTable
                        columns={["Lineup", "Property", "Value", "Action"]}
                        rows={propertyRelations.map((item) => ({
                            action: (
                                <button
                                    className="row-action danger"
                                    disabled={!canManage}
                                    onClick={() => void onRelationDelete(item.grenade_id, item.property_id)}
                                    type="button"
                                >
                                    Unlink
                                </button>
                            ),
                            cells: [`#${item.grenade_id}`, item.name, item.value ?? ""],
                            key: `${item.grenade_id}-${item.property_id}`,
                        }))}
                    />
                </CatalogCard>
            </section>
        </>
    )
}

function CatalogCard({ children, title }: { children: ReactNode; title: string }) {
    return (
        <article className="catalog-card">
            <h3>{title}</h3>
            {children}
        </article>
    )
}

function FormHeading({ onNew, title }: { onNew: () => void; title: string }) {
    return (
        <div className="form-heading">
            <h3>{title}</h3>
            <button className="secondary-action compact" onClick={onNew} type="button">
                New
            </button>
        </div>
    )
}

function RowActions({ canManage, onDelete, onEdit }: { canManage: boolean; onDelete: () => Promise<void>; onEdit: () => void }) {
    return (
        <>
            <button className="row-action secondary" disabled={!canManage} onClick={onEdit} type="button">
                Edit
            </button>
            <button className="row-action danger" disabled={!canManage} onClick={() => void onDelete()} type="button">
                Delete
            </button>
        </>
    )
}

function SimpleTable({
    columns,
    rows,
}: {
    columns: string[]
    rows: Array<{ action: ReactNode; cells: string[]; key: number | string }>
}) {
    if (rows.length === 0) {
        return <div className="empty-state compact-empty">No records loaded.</div>
    }
    return (
        <div className="table-wrap compact-table">
            <table>
                <thead>
                    <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key}>
                            {row.cells.map((cell, index) => (
                                <td data-label={columns[index]} key={columns[index]}>{cell}</td>
                            ))}
                            <td data-label={columns[columns.length - 1]}>{row.action}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function submitForm(event: FormEvent<HTMLFormElement>, action: () => Promise<void>) {
    event.preventDefault()
    void action()
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
