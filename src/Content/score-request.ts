import { updateMarkerState } from "./Marker/Marker.ts"
import type { MarkerInteractionPayload } from "./types.ts"
import { buildEnrichedLinkedInProfilePayloadForContent } from "./VoyagerApi/index.ts"

export const SCORE_MARKER_MESSAGE_TYPE = "scoreMarker" as const

export function requestMarkerScore(
  payload: MarkerInteractionPayload,
  options?: { onSendFailed?: () => void }
): void {
  updateMarkerState(payload.id, { state: "loading" })
  void (async () => {
    try {
      const enrichedProfile =
        payload.kind === "profile"
          ? await buildEnrichedLinkedInProfilePayloadForContent(payload.data)
          : undefined

      chrome.runtime.sendMessage(
        {
          type: SCORE_MARKER_MESSAGE_TYPE,
          markerId: payload.id,
          kind: payload.kind,
          data: payload.data,
          enrichedProfile,
        },
        () => {
          if (chrome.runtime.lastError) {
            updateMarkerState(payload.id, { state: "default" })
            options?.onSendFailed?.()
          }
        }
      )
    } catch {
      updateMarkerState(payload.id, { state: "default" })
      options?.onSendFailed?.()
    }
  })()
}
