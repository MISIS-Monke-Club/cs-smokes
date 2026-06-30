export type LoadState = "idle" | "loading" | "ready" | "error"
export type ApprovedFilter = "all" | "approved" | "pending"
export type LineupFiltersState = {
    approved: ApprovedFilter
    ordering: "date_of_creation" | "-date_of_creation" | "by_alphabet" | "-by_alphabet"
    query: string
}
export type MapPoolFilter = "all" | "active" | "reserve"
export type MapFiltersState = {
    ordering: "quantity" | "-quantity" | "by_alphabet" | "-by_alphabet"
    pool: MapPoolFilter
    query: string
}
export type RelationFormState = {
    grenadeID: string
    propertyID: string
}

export function approvedFilterValue(value: ApprovedFilter): boolean | undefined {
    switch (value) {
        case "approved":
            return true
        case "pending":
            return false
        case "all":
            return undefined
    }
}

export function mapPoolFilterValue(value: MapPoolFilter): boolean | undefined {
    switch (value) {
        case "active":
            return true
        case "reserve":
            return false
        case "all":
            return undefined
    }
}
