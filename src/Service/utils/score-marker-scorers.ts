import type { Post, Profile } from "../../Content/types.ts"
import type { ScoringIntentionSnapshot } from "../../shared/get-intention-from-chrome.ts"
import type { ScoringSettingsBundle } from "../../shared/get-scoring-settings-from-chrome.ts"

/** Placeholder: replace with real profile scoring. */
export function scoreLinkedInProfile(
  _data: Profile,
  _intention: ScoringIntentionSnapshot,
  _settings: ScoringSettingsBundle
): number {
  const payload = {
    data: _data,
    intention: _intention,
    profileSettings: _settings.profile,
  }
  console.log("scoreLinkedInProfile", payload)
  return Math.floor(Math.random() * 101)
}

/** Placeholder: replace with real post scoring. */
export function scoreLinkedInPost(
  _data: Post,
  _intention: ScoringIntentionSnapshot,
  _settings: ScoringSettingsBundle
): number {
  const payload = {
    data: _data,
    intention: _intention,
  }
  // const settings = _settings.post

  // const PARSED_POST_SCORING_DATA = ""_



  console.log("scoreLinkedInPost", payload)
  return Math.floor(Math.random() * 101)
}
