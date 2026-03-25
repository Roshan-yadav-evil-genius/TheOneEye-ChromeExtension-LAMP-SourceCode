import { updateMarkerState } from "./marker.ts"
import {
  formatScoreEnrichmentError,
  formatScoreRuntimeError,
  notifyError,
  notifyInfo,
} from "../Notifier/index.ts"
import { tryRestoreProfileMarkerFromCache } from "./restore-from-cache.ts"
import type { MarkerInteractionPayload } from "../types.ts"
import { buildEnrichedLinkedInProfilePayloadForContent } from "../VoyagerApi/index.ts"

function scoringStartMessage(payload: MarkerInteractionPayload): string {
  if (payload.kind === "profile") {
    const personName = payload.data.name.trim() || "profile"
    return `Scoring ${personName}`
  }
  const personName = payload.data.publisher.name.trim() || "unknown person"
  return `Scoring post of ${personName}`
}

/** Restores profile score from cache or sets marker to error. */
async function restoreCachedProfileScoreOrError(markerId: string): Promise<void> {
  const restored = await tryRestoreProfileMarkerFromCache(markerId)
  if (!restored) {
    updateMarkerState(markerId, { state: "error" })
  }
}

/** Runtime message type sent to the service worker to score a marker. */
export const SCORE_MARKER_MESSAGE_TYPE = "scoreMarker" as const

/**
 * Starts scoring: sets loading, enriches profile if needed, then sendMessage to the service worker.
 *
 * @remarks On send or enrichment failure, tries cache restore for profiles, shows notifier, and calls onSendFailed.
 */
export function requestMarkerScore(
  payload: MarkerInteractionPayload,
  options?: { onSendFailed?: () => void }
): void {
  console.log("[SCORE][REQUEST] start", {
    markerId: payload.id,
    kind: payload.kind,
    payload,
  })
  notifyInfo(scoringStartMessage(payload))
  updateMarkerState(payload.id, { state: "loading" })
  void (async () => {
    try {
      const enrichStartedAt = Date.now()
      if (payload.kind === "profile") {
        console.log("[SCORE][REQUEST] profile enrichment start", {
          markerId: payload.id,
        })
      }
      const enrichedProfile =
        payload.kind === "profile"
          ? await buildEnrichedLinkedInProfilePayloadForContent(payload.data)
          : undefined
      if (payload.kind === "profile") {
        console.log("[SCORE][REQUEST] profile enrichment done", {
          markerId: payload.id,
          durationMs: Date.now() - enrichStartedAt,
          enrichedProfile,
        })
      }

      const message = {
        type: SCORE_MARKER_MESSAGE_TYPE,
        markerId: payload.id,
        kind: payload.kind,
        data: payload.data,
        enrichedProfile,
      } as const
      console.log("[SCORE][REQUEST] sending message to service", message)
      chrome.runtime.sendMessage(message, () => {
        if (chrome.runtime.lastError) {
          console.error("[SCORE][REQUEST][ERROR] sendMessage lastError", {
            markerId: payload.id,
            kind: payload.kind,
            error: chrome.runtime.lastError,
          })
          void (async () => {
            await restoreCachedProfileScoreOrError(payload.id)
            notifyError(formatScoreRuntimeError())
            options?.onSendFailed?.()
          })()
          return
        }
        console.log("[SCORE][REQUEST] message accepted by runtime", {
          markerId: payload.id,
          kind: payload.kind,
        })
      })
    } catch (error) {
      console.error("[SCORE][REQUEST][ERROR] failed before sendMessage", {
        markerId: payload.id,
        kind: payload.kind,
        error,
      })
      await restoreCachedProfileScoreOrError(payload.id)
      notifyError(formatScoreEnrichmentError())
      options?.onSendFailed?.()
    }
  })()
}
