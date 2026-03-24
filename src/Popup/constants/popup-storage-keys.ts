/**
 * chrome.storage.local keys for the popup. Use these constants everywhere to avoid typos.
 * Prefix matches the primary tab / domain: intention_*, settings_*.
 */
export const INTENTION_PROFILE = "intention_profile" as const
export const INTENTION_POST = "intention_post" as const
export const INTENTION_KEYWORDS = "intention_keywords" as const
export const INTENTION_HEADLINE_TAGS = "intention_headline_tags" as const

export {
  SETTINGS_POST_SCORING,
  SETTINGS_PROFILE_SCORING,
} from "../../shared/scoring-storage-keys.ts"

export { PROFILE_SCORE_CACHE } from "../../shared/profile-score-cache-storage-key.ts"

export {
  DASHBOARD_POST_HITS,
  DASHBOARD_PROFILE_HITS,
  DASHBOARD_QUALIFIED,
  DASHBOARD_THRESHOLD_HITS,
} from "../../shared/dashboard-storage-keys.ts"

export { STATS_LIFETIME } from "../../shared/stats-storage-keys.ts"
