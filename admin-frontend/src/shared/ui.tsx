import { FormEvent, ReactNode } from "react"

export function FormHeading({ onNew, title }: { onNew: () => void; title: string }) {
    return (
        <div className="form-heading">
            <h3>{title}</h3>
            <button className="secondary-action compact" onClick={onNew} type="button">
                New
            </button>
        </div>
    )
}

export function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="metric">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

export function RowActions({ canManage, onDelete, onEdit }: { canManage: boolean; onDelete: () => Promise<void>; onEdit: () => void }) {
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

export function SimpleTable({
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
                    <tr>
                        {columns.map((column) => (
                            <th key={column}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key}>
                            {row.cells.map((cell, index) => (
                                <td data-label={columns[index]} key={columns[index]}>
                                    {cell}
                                </td>
                            ))}
                            <td data-label={columns[columns.length - 1]}>{row.action}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function submitForm(event: FormEvent<HTMLFormElement>, action: () => Promise<void>) {
    event.preventDefault()
    void action()
}
