import { getMarkerPayloadForId, updateMarkerState } from "./Marker/Marker.ts"
import { getScoringSettingsFromChrome } from "../shared/get-scoring-settings-from-chrome.ts"
import { getCachedProfileScore } from "../shared/profile-score-cache.ts"

/**
 * If the marker is a profile, cache is enabled, and a score exists in storage
 * for that profile URL, reapplies score UI. Returns whether restore happened.
 */
export async function tryRestoreProfileMarkerFromCache(
  markerId: string
): Promise<boolean> {
  const payload = getMarkerPayloadForId(markerId)
  if (!payload || payload.kind !== "profile") return false

  try {
    const settings = await getScoringSettingsFromChrome()
    if (!settings.profile.useCache) return false
    const key = payload.data.url
    if (!key) return false
    const score = await getCachedProfileScore(key)
    if (score === null) return false
    updateMarkerState(markerId, {
      state: "score",
      score,
      threshold: settings.profile.threshold,
    })
    return true
  } catch {
    return false
  }
}
