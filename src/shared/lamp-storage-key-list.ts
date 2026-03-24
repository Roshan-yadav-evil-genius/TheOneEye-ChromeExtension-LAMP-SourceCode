import {
  DASHBOARD_POST_HITS,
  DASHBOARD_PROFILE_HITS,
  DASHBOARD_QUALIFIED,
  DASHBOARD_THRESHOLD_HITS,
} from "./dashboard-storage-keys.ts"
import { PROFILE_SCORE_CACHE } from "./profile-score-cache-storage-key.ts"
import {
  SETTINGS_POST_SCORING,
  SETTINGS_PROFILE_SCORING,
} from "./scoring-storage-keys.ts"
import { STATS_LIFETIME } from "./stats-storage-keys.ts"

/** Intention keys — keep aligned with Popup constants/popup-storage-keys.ts */
const INTENTION_PROFILE = "intention_profile" as const
const INTENTION_POST = "intention_post" as const
const INTENTION_KEYWORDS = "intention_keywords" as const
const INTENTION_HEADLINE_TAGS = "intention_headline_tags" as const

/**
 * All chrome.storage.local keys owned by this extension (bytes + documentation).
 */
export const LAMP_STORAGE_KEYS = [
  INTENTION_PROFILE,
  INTENTION_POST,
  INTENTION_KEYWORDS,
  INTENTION_HEADLINE_TAGS,
  SETTINGS_PROFILE_SCORING,
  SETTINGS_POST_SCORING,
  PROFILE_SCORE_CACHE,
  DASHBOARD_THRESHOLD_HITS,
  DASHBOARD_QUALIFIED,
  DASHBOARD_POST_HITS,
  DASHBOARD_PROFILE_HITS,
  STATS_LIFETIME,
] as const

export type LampStorageKey = (typeof LAMP_STORAGE_KEYS)[number]
