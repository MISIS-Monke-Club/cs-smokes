import { useCallback, useEffect, useMemo, useState } from "react"

import {
    AdminGrenadeClass,
    AdminLineup,
    AdminMap,
    AdminProperty,
    AdminPropertyRelation,
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
    PullRequestDetail,
    PullRequestSummary,
} from "../api"
import {
    approvedFilterValue,
    LineupFiltersState,
    LoadState,
    mapPoolFilterValue,
    MapFiltersState,
    RelationFormState,
} from "../features/content-catalog/types"
import { canManageContent } from "../lineups"
import { AdminMe, canManageUsers, clearSession, readSession } from "../session"

export function useAdminData() {
    const [token, setToken] = useState(() => readSession()?.token ?? "")
    const [me, setMe] = useState<AdminMe | null>(null)
    const [requests, setRequests] = useState<PullRequestSummary[]>([])
    const [users, setUsers] = useState<AdminUser[]>([])
    const [lineups, setLineups] = useState<AdminLineup[]>([])
    const [lineupFilters, setLineupFilters] = useState<LineupFiltersState>({ approved: "all", ordering: "-date_of_creation", query: "" })
    const [selectedLineupID, setSelectedLineupID] = useState<number | null>(null)
    const [maps, setMaps] = useState<AdminMap[]>([])
    const [mapFilters, setMapFilters] = useState<MapFiltersState>({ ordering: "by_alphabet", pool: "all", query: "" })
    const [grenadeClasses, setGrenadeClasses] = useState<AdminGrenadeClass[]>([])
    const [properties, setProperties] = useState<AdminProperty[]>([])
    const [propertyRelations, setPropertyRelations] = useState<AdminPropertyRelation[]>([])
    const [relationForm, setRelationForm] = useState<RelationFormState>({ grenadeID: "", propertyID: "" })
    const [selectedID, setSelectedID] = useState<number | null>(null)
    const [detail, setDetail] = useState<PullRequestDetail | null>(null)
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

    return {
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
        selectedLineupID,
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
    }
}
