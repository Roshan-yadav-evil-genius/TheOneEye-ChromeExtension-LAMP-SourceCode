import { updateMarkerState } from "./Marker/Marker.ts"
import {
  formatScoreEnrichmentError,
  formatScoreRuntimeError,
  notifyError,
} from "./Notifier/index.ts"
import { tryRestoreProfileMarkerFromCache } from "./try-restore-profile-marker-from-cache.ts"
import type { MarkerInteractionPayload } from "./types.ts"
import { buildEnrichedLinkedInProfilePayloadForContent } from "./VoyagerApi/index.ts"

async function restoreCachedProfileScoreOrDefault(markerId: string): Promise<void> {
  const restored = await tryRestoreProfileMarkerFromCache(markerId)
  if (!restored) {
    updateMarkerState(markerId, { state: "default" })
  }
}

export const SCORE_MARKER_MESSAGE_TYPE = "scoreMarker" as const

export function requestMarkerScore(
  payload: MarkerInteractionPayload,
  options?: { onSendFailed?: () => void }
): void {
  console.log("[SCORE][REQUEST] start", {
    markerId: payload.id,
    kind: payload.kind,
    payload,
  })
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
            await restoreCachedProfileScoreOrDefault(payload.id)
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
      await restoreCachedProfileScoreOrDefault(payload.id)
      notifyError(formatScoreEnrichmentError())
      options?.onSendFailed?.()
    }
  })()
}
