import { THE_ONE_EYE_MARKER_CLASS } from "./constants.ts"
import {
  clearAutoscoreBusyIfMatches,
  getAutoscoreBusyMarkerId,
  setAutoscoreBusyMarkerId,
} from "./marker-autoscore-busy.ts"
import {
  getMarkerAutoscoreFlags,
  getMarkerPayloadForId,
  MARKER_KIND_ATTRIBUTE,
  MARKER_STATE_ATTRIBUTE,
  setMarkerAutoscoreFlags,
} from "./Marker/Marker.ts"
import { runAllLinkedInParsers } from "./Parser/index.ts"
import { requestMarkerScore } from "./score-request.ts"
import type { MarkerKind, ScoringSectionFlags } from "./types.ts"
import { getScoringSettingsFromChrome } from "../shared/get-scoring-settings-from-chrome.ts"

/** Must match [scoring-storage-keys.ts](../../shared/scoring-storage-keys.ts). */
const SETTINGS_PROFILE_SCORING = "settings_profile_scoring" as const
const SETTINGS_POST_SCORING = "settings_post_scoring" as const

export function notifyAutoscoreScoreFinished(
  markerId: string,
  kind: MarkerKind
): void {
  clearAutoscoreBusyIfMatches(markerId, kind)
  queueMicrotask(() => {
    tryStartAutoscoreForKind(kind)
  })
}

function tryStartAutoscoreForKind(kind: MarkerKind): void {
  const flags = getMarkerAutoscoreFlags()
  if (kind === "profile" && !flags.profile) return
  if (kind === "post" && !flags.post) return
  if (getAutoscoreBusyMarkerId(kind) !== null) return

  const selector = `button.${THE_ONE_EYE_MARKER_CLASS}[${MARKER_KIND_ATTRIBUTE}="${kind}"][${MARKER_STATE_ATTRIBUTE}="default"]`
  const el = document.querySelector(selector)
  if (!(el instanceof HTMLButtonElement) || !el.id) return

  const payload = getMarkerPayloadForId(el.id)
  if (!payload) return

  setAutoscoreBusyMarkerId(kind, el.id)

  const markerId = el.id
  requestMarkerScore(payload, {
    onSendFailed: () => {
      clearAutoscoreBusyIfMatches(markerId, kind)
      queueMicrotask(() => {
        tryStartAutoscoreForKind(kind)
      })
    },
  })
}

export function tickAutoscoreAfterScan(): void {
  tryStartAutoscoreForKind("profile")
  tryStartAutoscoreForKind("post")
}

async function refreshScoringFromStorage(): Promise<ScoringSectionFlags> {
  const settings = await getScoringSettingsFromChrome()
  setMarkerAutoscoreFlags({
    profile: settings.profile.sectionEnabled && settings.profile.autoscore,
    post: settings.post.sectionEnabled && settings.post.autoscore,
  })
  return {
    profile: settings.profile.sectionEnabled,
    post: settings.post.sectionEnabled,
  }
}

export async function registerMarkerAutoscore(): Promise<void> {
  await refreshScoringFromStorage()

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return
    if (!changes[SETTINGS_PROFILE_SCORING] && !changes[SETTINGS_POST_SCORING]) {
      return
    }
    void refreshScoringFromStorage().then((section) => {
      runAllLinkedInParsers(section)
      tickAutoscoreAfterScan()
    })
  })

  tickAutoscoreAfterScan()
}
