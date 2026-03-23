import type {
  PostScoringSettings,
  ProfileScoringSettings,
} from "../Popup/types/extension-settings.ts"

import {
  SETTINGS_POST_SCORING,
  SETTINGS_PROFILE_SCORING,
} from "./scoring-storage-keys.ts"

/** Keep aligned with `DEFAULT_PROFILE_SCORING` in Popup `scoring-settings-store.ts`. */
const DEFAULT_PROFILE_SCORING: ProfileScoringSettings = {
  sectionEnabled: true,
  threshold: 8,
  autoscore: true,
  headline: true,
  about: true,
  activity: false,
  activityPublished: false,
  activityReacted: false,
  activityCommented: false,
  useCache: true,
}

/** Keep aligned with `DEFAULT_POST_SCORING` in Popup `scoring-settings-store.ts`. */
const DEFAULT_POST_SCORING: PostScoringSettings = {
  sectionEnabled: true,
  threshold: 5,
  autoscore: true,
}

const THRESHOLD_MIN = 1
const THRESHOLD_MAX = 100

function clampThreshold(n: number): number {
  return Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, Math.round(n)))
}

function mergeProfile(
  partial?: Partial<ProfileScoringSettings>
): ProfileScoringSettings {
  const m = { ...DEFAULT_PROFILE_SCORING, ...partial }
  m.threshold = clampThreshold(m.threshold)
  return m
}

function mergePost(partial?: Partial<PostScoringSettings>): PostScoringSettings {
  const m = { ...DEFAULT_POST_SCORING, ...partial }
  m.threshold = clampThreshold(m.threshold)
  return m
}

export type ScoringSettingsBundle = {
  profile: ProfileScoringSettings
  post: PostScoringSettings
}

/**
 * Full profile/post scoring settings from chrome.storage.local (merged defaults,
 * clamped thresholds). Same persistence shape as the popup scoring store.
 */
export async function getScoringSettingsFromChrome(): Promise<ScoringSettingsBundle> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return {
      profile: mergeProfile(),
      post: mergePost(),
    }
  }

  const raw = await chrome.storage.local.get([
    SETTINGS_PROFILE_SCORING,
    SETTINGS_POST_SCORING,
  ])

  let profilePartial: Partial<ProfileScoringSettings> | undefined
  const p = raw[SETTINGS_PROFILE_SCORING]
  if (p && typeof p === "object" && !Array.isArray(p)) {
    profilePartial = p as Partial<ProfileScoringSettings>
  }

  let postPartial: Partial<PostScoringSettings> | undefined
  const po = raw[SETTINGS_POST_SCORING]
  if (po && typeof po === "object" && !Array.isArray(po)) {
    postPartial = po as Partial<PostScoringSettings>
  }

  return {
    profile: mergeProfile(profilePartial),
    post: mergePost(postPartial),
  }
}

/** Whether profile/post scoring sections are enabled (markers may be shown). */
export async function getScoringSectionEnabledFromChrome(): Promise<{
  profile: boolean
  post: boolean
}> {
  const s = await getScoringSettingsFromChrome()
  return {
    profile: s.profile.sectionEnabled,
    post: s.post.sectionEnabled,
  }
}
