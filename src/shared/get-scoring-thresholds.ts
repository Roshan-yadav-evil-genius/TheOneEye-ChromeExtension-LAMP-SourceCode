import type {
  PostScoringSettings,
  ProfileScoringSettings,
} from "../Popup/types/extension-settings.ts"

/** Must match [scoring-storage-keys.ts](scoring-storage-keys.ts); inlined so the SW bundle has no extra chunks. */
const SETTINGS_PROFILE_SCORING = "settings_profile_scoring" as const
const SETTINGS_POST_SCORING = "settings_post_scoring" as const

/** Defaults match `DEFAULT_PROFILE_SCORING` / `DEFAULT_POST_SCORING` in popup store. */
const DEFAULT_PROFILE_THRESHOLD = 8
const DEFAULT_POST_THRESHOLD = 5

const THRESHOLD_MIN = 1
const THRESHOLD_MAX = 100

function clampThreshold(n: number): number {
  return Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, Math.round(n)))
}

export async function getScoringThresholdsFromChrome(): Promise<{
  profile: number
  post: number
}> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return {
      profile: DEFAULT_PROFILE_THRESHOLD,
      post: DEFAULT_POST_THRESHOLD,
    }
  }

  const raw = await chrome.storage.local.get([
    SETTINGS_PROFILE_SCORING,
    SETTINGS_POST_SCORING,
  ])

  let profile = DEFAULT_PROFILE_THRESHOLD
  let post = DEFAULT_POST_THRESHOLD

  const p = raw[SETTINGS_PROFILE_SCORING]
  if (
    p &&
    typeof p === "object" &&
    !Array.isArray(p) &&
    typeof (p as ProfileScoringSettings).threshold === "number"
  ) {
    profile = clampThreshold((p as ProfileScoringSettings).threshold)
  }

  const po = raw[SETTINGS_POST_SCORING]
  if (
    po &&
    typeof po === "object" &&
    !Array.isArray(po) &&
    typeof (po as PostScoringSettings).threshold === "number"
  ) {
    post = clampThreshold((po as PostScoringSettings).threshold)
  }

  return { profile, post }
}
