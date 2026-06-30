import { AlertTriangle, CheckCircle2, Clock3, LogOut, MessageSquare, Shield, Users } from "lucide-react"
import { useState } from "react"

import {
    approvePullRequest,
    cancelPullRequest,
    createComment,
    createGrenadeClass,
    createLineup,
    createMap,
    createProperty,
    createPropertyRelation,
    deleteComment,
    deleteGrenadeClass,
    deleteLineup,
    deleteMap,
    deleteProperty,
    deletePropertyRelation,
    errorMessage,
    rejectPullRequest,
    setUserRoles,
    updateGrenadeClass,
    updateLineup,
    updateMap,
    updateProperty,
} from "./api"
import {
    classInputFromForm,
    emptyClassForm,
    emptyMapForm,
    emptyPropertyForm,
    mapInputFromForm,
    propertyInputFromForm,
} from "./catalog"
import { LoginScreen, RolePanel } from "./features/auth/LoginScreen"
import { CatalogPanel, LineupsPanel } from "./features/content-catalog/ContentPanels"
import { DetailPanel, PullRequestTable } from "./features/moderation/ModerationPanels"
import { UsersPanel } from "./features/users/UsersPanel"
import { useAdminData } from "./hooks/useAdminData"
import { canManageContent, emptyLineupForm, lineupFormFromLineup, lineupInputFromForm } from "./lineups"
import { canGrantRoles, canManageUsers, canModeratePullRequests } from "./session"
import { Metric } from "./shared/ui"

export function App() {
    const adminData = useAdminData()
    const [editingLineupID, setEditingLineupID] = useState<number | null>(null)
    const [lineupForm, setLineupForm] = useState(emptyLineupForm)
    const [mapForm, setMapForm] = useState(emptyMapForm)
    const [editingMapID, setEditingMapID] = useState<number | null>(null)
    const [classForm, setClassForm] = useState(emptyClassForm)
    const [editingClassID, setEditingClassID] = useState<number | null>(null)
    const [propertyForm, setPropertyForm] = useState(emptyPropertyForm)
    const [editingPropertyID, setEditingPropertyID] = useState<number | null>(null)
    const [commentText, setCommentText] = useState("")

    const {
        detail,
        grenadeClasses,
        lineups,
        lineupFilters,
        loadAdminData,
        loadDetail,
        loadState,
        maps,
        mapFilters,
        me,
        message,
        properties,
        propertyRelations,
        relationForm,
        requests,
        resetSession,
        selectedID,
        selectedLineup,
        setLineupFilters,
        setMapFilters,
        setMessage,
        setRelationForm,
        setSelectedID,
        setSelectedLineupID,
        setToken,
        stats,
        token,
        users,
    } = adminData

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
                            onApprove={(id) => handleAdminAction(() => approvePullRequest(token, id))}
                            onSelect={setSelectedID}
                            requests={requests}
                            selectedID={selectedID}
                        />
                        <DetailPanel
                            canModerate={canModeratePullRequests(me)}
                            commentText={commentText}
                            detail={detail}
                            me={me}
                            onCancel={(id) => handleAdminAction(() => cancelPullRequest(token, id))}
                            onCommentText={setCommentText}
                            onCreateComment={(id) =>
                                handleAdminAction(async () => {
                                    await createComment(token, id, commentText)
                                    setCommentText("")
                                })
                            }
                            onDeleteComment={(id) => handleAdminAction(() => deleteComment(token, id))}
                            onReject={(id) => handleAdminAction(() => rejectPullRequest(token, id))}
                        />
                    </div>
                </section>

                <section className="panel follow-panel" id="users">
                    <UsersPanel
                        canGrant={canGrantRoles(me)}
                        canView={canManageUsers(me)}
                        onRolesChange={(userID, roles) =>
                            handleAdminAction(async () => {
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
                        onDelete={(id) => handleAdminAction(() => deleteLineup(token, id))}
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
                        onSubmit={() =>
                            handleAdminAction(async () => {
                                const input = lineupInputFromForm(lineupForm)
                                if (editingLineupID == null) {
                                    await createLineup(token, input)
                                } else {
                                    await updateLineup(token, editingLineupID, input)
                                }
                                setEditingLineupID(null)
                                setLineupForm(emptyLineupForm)
                            })
                        }
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
                        onClassDelete={(id) => handleAdminAction(() => deleteGrenadeClass(token, id))}
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
                            handleAdminAction(async () => {
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
                        onMapDelete={(id) => handleAdminAction(() => deleteMap(token, id))}
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
                            handleAdminAction(async () => {
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
                        onPropertyDelete={(id) => handleAdminAction(() => deleteProperty(token, id))}
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
                            handleAdminAction(async () => {
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
                        onRelationDelete={(grenadeID, propertyID) => handleAdminAction(() => deletePropertyRelation(token, grenadeID, propertyID))}
                        onRelationFormChange={setRelationForm}
                        onRelationSubmit={() =>
                            handleAdminAction(async () => {
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

    async function handleAdminAction(action: () => Promise<void>) {
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
