export const queryParamsConfig = {
    maps: {
        filters: {
            isEsportsPool: {
                yes: true,
                no: false,
            },
        },
        sortings: {
            byPopularity: {
                asc: "popularity",
                desc: "-popularity",
            },
            byAlphabet: {
                asc: "by_alphabet",
                desc: "-by_alphabet",
            },
            byLineupsCount: {
                asc: "lineups_count",
                desc: "-lineups_count",
            },
        },
    },
    grenades: {
        sortings: {
            byDateOfCreation: {
                asc: "date_of_creation",
                desc: "-date_of_creation",
            },
            byAlphabet: {
                asc: "by_alphabet",
                desc: "-by_alphabet",
            },
        },
        filters: {
            isApproved: {
                yes: true,
                no: false,
            },
        },
    },
}
