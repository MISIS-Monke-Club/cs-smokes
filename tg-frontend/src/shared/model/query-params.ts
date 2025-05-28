export type GrenadeFilters = {
    is_approved?: boolean
    query?: string
    ordering?:
        | "date_of_creation"
        | "-date_of_creation"
        | "by_alphabet"
        | "-by_alphabet"
}
export type GrenadeFiltersDB = {
    is_approved?: string
    query?: string
    ordering?: string
}

export type MapFilters = {
    query?: string
    esports_pool: boolean
    ordering?:
        | "popularity"
        | "-popularity"
        | "by_alphabet"
        | "-by_alphabet"
        | "lineups_count"
        | "-lineups_count"
}
export type MapFiltersDB = {
    query?: string
    esports_pool: string
    ordering?: string
}
