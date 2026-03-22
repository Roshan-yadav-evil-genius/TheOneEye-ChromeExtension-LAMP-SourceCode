/**
 * chrome.storage.local keys for the popup. Use these constants everywhere to avoid typos.
 * Prefix matches the primary tab / domain: intention_*, settings_*.
 */
export const INTENTION_PROFILE = "intention_profile" as const
export const INTENTION_POST = "intention_post" as const
export const INTENTION_KEYWORDS = "intention_keywords" as const

export {
  SETTINGS_POST_SCORING,
  SETTINGS_PROFILE_SCORING,
} from "../../shared/scoring-storage-keys.ts"
