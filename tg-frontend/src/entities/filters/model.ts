export type GrenadeFilters = {
    is_approved?: boolean
    query?: string
    ordering?:
        | "date_of_creation"
        | "-date_of_creation"
        | "by_alphabet"
        | "-by_alphabet"
}

export type MapFilters = {
    query?: string
    ordering?:
        | "popularity"
        | "-popularity"
        | "by_alphabet"
        | "-by_alphabet"
        | "lineups_count"
        | "-lineups_count"
}
