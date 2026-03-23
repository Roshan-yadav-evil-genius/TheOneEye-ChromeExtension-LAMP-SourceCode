import type { Post, Profile } from "../Content/types.ts"
import { getIntentionFromChrome } from "../shared/get-intention-from-chrome.ts"
import { getScoringSettingsFromChrome } from "../shared/get-scoring-settings-from-chrome.ts"
import { delayMs } from "./utils/delay.ts"
import { incrementScoreStatsAfterEmit } from "./utils/increment-score-stats.ts"
import { emitMarkerScoreError, emitMarkerScoreResult } from "./utils/score-marker-emit.ts"
import { isScoreMarkerMessage } from "./utils/score-marker-message-guard.ts"
import {
  scoreLinkedInPost,
  scoreLinkedInProfile,
} from "./utils/score-marker-scorers.ts"

const SCORE_DELAY_MS = 2000

export function registerScoreMarkerListener(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isScoreMarkerMessage(message)) {
      return false
    }
    const tabId = sender.tab?.id
    if (tabId == null) {
      sendResponse({ ok: false, error: "no_tab" })
      return false
    }

    void (async () => {
      const { markerId, kind, data } = message
      console.log("scoreMarkerHandler", message)
      try {
        const [settings, intention] = await Promise.all([
          getScoringSettingsFromChrome(),
          getIntentionFromChrome(),
        ])
        await delayMs(SCORE_DELAY_MS)

        const score =
          kind === "profile"
            ? scoreLinkedInProfile(data as Profile, intention, settings)
            : scoreLinkedInPost(data as Post, intention, settings)
        const threshold =
          kind === "post" ? settings.post.threshold : settings.profile.threshold

        await emitMarkerScoreResult(tabId, {
          markerId,
          kind,
          data,
          score,
          threshold,
        })
        await incrementScoreStatsAfterEmit({ kind, score, threshold })
        sendResponse({ ok: true })
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e)
        await emitMarkerScoreError(tabId, markerId, err)
        sendResponse({ ok: false, error: err })
      }
    })()

    return true
  })
}
