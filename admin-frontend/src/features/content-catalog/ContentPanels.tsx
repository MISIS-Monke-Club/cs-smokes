import { ReactNode } from "react"

import { AdminGrenadeClass, AdminLineup, AdminMap, AdminProperty, AdminPropertyRelation } from "../../api"
import { ClassFormState, MapFormState, PropertyFormState } from "../../catalog"
import { LineupFormState } from "../../lineups"
import { FormHeading, RowActions, SimpleTable, submitForm } from "../../shared/ui"
import { ApprovedFilter, LineupFiltersState, MapFiltersState, MapPoolFilter, RelationFormState } from "./types"

export function LineupsPanel({
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

export function CatalogPanel({
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
                            action: <RowActions canManage={canManage} onDelete={() => onMapDelete(item.map_id)} onEdit={() => onMapEdit(item)} />,
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
                        <button disabled={!canManage} type="submit">
                            {editingMapID == null ? "Create map" : "Save map"}
                        </button>
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
                        <button disabled={!canManage} type="submit">
                            {editingClassID == null ? "Create class" : "Save class"}
                        </button>
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
                        <button disabled={!canManage} type="submit">
                            {editingPropertyID == null ? "Create property" : "Save property"}
                        </button>
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
                        <button disabled={!canManage} type="submit">
                            Link property
                        </button>
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
