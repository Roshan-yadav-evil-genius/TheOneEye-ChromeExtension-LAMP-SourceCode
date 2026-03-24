import type { Profile } from "../types.ts"
import type { ScoringIntentionSnapshot } from "../../shared/get-intention-from-chrome.ts"
import type { ScoringSettingsBundle } from "../../shared/get-scoring-settings-from-chrome.ts"

export type VoyagerActivityKey = "published" | "reacted" | "commented"

export type ProfileVoyagerApiPayload = {
  profile?: unknown
  published?: unknown
  reacted?: unknown
  commented?: unknown
}

export type EnrichedLinkedInProfilePayload = {
  raw: Profile
  api: ProfileVoyagerApiPayload
  intention: ScoringIntentionSnapshot
  settings: ScoringSettingsBundle
}
