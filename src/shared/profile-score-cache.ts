import { isExtensionContextInvalidatedError } from "./chrome-context-errors.ts"
import { PROFILE_SCORE_CACHE } from "./profile-score-cache-storage-key.ts"

type ProfileScoreCacheMap = Record<string, number>

function isProfileScoreCacheMap(v: unknown): v is ProfileScoreCacheMap {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false
  for (const [, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val !== "number" || !Number.isFinite(val)) return false
  }
  return true
}

async function readMap(): Promise<ProfileScoreCacheMap> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return {}
  }
  try {
    const raw = await chrome.storage.local.get(PROFILE_SCORE_CACHE)
    const blob = raw[PROFILE_SCORE_CACHE]
    if (isProfileScoreCacheMap(blob)) return blob
    return {}
  } catch (e) {
    if (isExtensionContextInvalidatedError(e)) return {}
    throw e
  }
}

/**
 * Returns cached score for profile public path (e.g. `/in/handle/`), or null if missing.
 */
export async function getCachedProfileScore(
  profileKey: string
): Promise<number | null> {
  if (!profileKey) return null
  const map = await readMap()
  const score = map[profileKey]
  return typeof score === "number" && Number.isFinite(score) ? score : null
}

/**
 * Persists score for profile path; overwrites any previous value.
 */
export async function setCachedProfileScore(
  profileKey: string,
  score: number
): Promise<void> {
  if (!profileKey || !Number.isFinite(score)) return
  if (typeof chrome === "undefined" || !chrome.storage?.local) return
  try {
    const map = await readMap()
    map[profileKey] = score
    await chrome.storage.local.set({ [PROFILE_SCORE_CACHE]: map })
  } catch (e) {
    if (isExtensionContextInvalidatedError(e)) return
    throw e
  }
}
