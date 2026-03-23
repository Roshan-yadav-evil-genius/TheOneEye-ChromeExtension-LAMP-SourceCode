import { useCallback, useEffect, useState } from "react"

import {
  DASHBOARD_STORAGE_KEYS,
  dropQualified,
  dropThresholdHit,
  qualifyThresholdHit,
  readDashboardLists,
  type DashboardListsSnapshot,
} from "@/lib/dashboard-lists-storage"

export function useDashboardLists(): {
  postHits: DashboardListsSnapshot["postHits"]
  profileHits: DashboardListsSnapshot["profileHits"]
  qualified: DashboardListsSnapshot["qualified"]
  loading: boolean
  dropPost: (id: string) => void
  dropProfile: (id: string) => void
  dropQualifiedRow: (id: string) => void
  qualifyPost: (id: string) => void
  qualifyProfile: (id: string) => void
} {
  const [snapshot, setSnapshot] = useState<DashboardListsSnapshot>({
    thresholdHits: [],
    postHits: [],
    profileHits: [],
    qualified: [],
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const next = await readDashboardLists()
    setSnapshot(next)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    void readDashboardLists().then((next) => {
      if (cancelled) return
      setSnapshot(next)
      setLoading(false)
    })
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return () => {
        cancelled = true
      }
    }
    const handler: Parameters<
      typeof chrome.storage.onChanged.addListener
    >[0] = (changes, area) => {
      if (area !== "local") return
      const touched = DASHBOARD_STORAGE_KEYS.some((k) => k in changes)
      if (!touched) return
      void readDashboardLists().then(setSnapshot)
    }
    chrome.storage.onChanged.addListener(handler)
    return () => {
      cancelled = true
      chrome.storage.onChanged.removeListener(handler)
    }
  }, [])

  const dropHit = useCallback(
    (id: string) => {
      void dropThresholdHit(id).then(() => refresh())
    },
    [refresh]
  )

  const dropQualifiedRow = useCallback(
    (id: string) => {
      void dropQualified(id).then(() => refresh())
    },
    [refresh]
  )

  const qualifyHit = useCallback(
    (id: string) => {
      void qualifyThresholdHit(id).then(() => refresh())
    },
    [refresh]
  )

  return {
    postHits: snapshot.postHits,
    profileHits: snapshot.profileHits,
    qualified: snapshot.qualified,
    loading,
    dropPost: dropHit,
    dropProfile: dropHit,
    qualifyPost: qualifyHit,
    qualifyProfile: qualifyHit,
    dropQualifiedRow,
  }
}
