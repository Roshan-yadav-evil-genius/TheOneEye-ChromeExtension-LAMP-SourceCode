import type { Post, Profile } from "../Content/types.ts"
import { getIntentionFromChrome } from "../shared/get-intention-from-chrome.ts"
import { getScoringSettingsFromChrome } from "../shared/get-scoring-settings-from-chrome.ts"
import { incrementScoreStatsAfterEmit } from "./utils/increment-score-stats.ts"
import { emitMarkerScoreError, emitMarkerScoreResult } from "./utils/score-marker-emit.ts"
import { isScoreMarkerMessage } from "./utils/score-marker-message-guard.ts"
import {
  scoreLinkedInPost,
  scoreLinkedInProfile,
} from "./utils/score-marker-scorers.ts"


export function registerScoreMarkerListener(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isScoreMarkerMessage(message)) {
      return false
    }
    console.log("[SCORE][SERVICE] received scoreMarker message", {
      markerId: message.markerId,
      kind: message.kind,
      message,
    })
    const tabId = sender.tab?.id
    if (tabId == null) {
      console.error("[SCORE][SERVICE][ERROR] sender tab id missing", {
        markerId: message.markerId,
        kind: message.kind,
        sender,
      })
      sendResponse({ ok: false, error: "no_tab" })
      return false
    }

    void (async () => {
      const { markerId, kind, data } = message
      try {
        console.log("[SCORE][SERVICE] loading settings and intention", {
          markerId,
          kind,
          tabId,
        })
        const [settings, intention] = await Promise.all([
          getScoringSettingsFromChrome(),
          getIntentionFromChrome(),
        ])
        console.log("[SCORE][SERVICE] settings and intention loaded", {
          markerId,
          kind,
          settings,
          intention,
        })

        console.log("[SCORE][SERVICE] scoring started", { markerId, kind })
        const score =
          kind === "profile"
            ? await scoreLinkedInProfile(
                message.enrichedProfile ?? {
                  raw: data as Profile,
                  api: {},
                  intention,
                  settings,
                }
              )
            : await scoreLinkedInPost(data as Post, intention, settings)
        const threshold =
          kind === "post" ? settings.post.threshold : settings.profile.threshold
        console.log("[SCORE][SERVICE] scoring finished", {
          markerId,
          kind,
          score,
          threshold,
        })

        console.log("[SCORE][SERVICE] emitting score result to content", {
          markerId,
          kind,
          tabId,
        })
        await emitMarkerScoreResult(tabId, {
          markerId,
          kind,
          data,
          score,
          threshold,
        })
        console.log("[SCORE][SERVICE] score result emitted", {
          markerId,
          kind,
          tabId,
        })
        console.log("[SCORE][SERVICE] updating score stats", {
          markerId,
          kind,
          score,
          threshold,
        })
        await incrementScoreStatsAfterEmit({ kind, score, threshold })
        console.log("[SCORE][SERVICE] score stats updated", { markerId, kind })
        sendResponse({ ok: true })
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e)
        console.error("[SCORE][SERVICE][ERROR] scoring flow failed", {
          markerId,
          kind,
          tabId,
          error: e,
          errorMessage: err,
        })
        await emitMarkerScoreError(tabId, markerId, err)
        sendResponse({ ok: false, error: err })
      }
    })()

    return true
  })
}
