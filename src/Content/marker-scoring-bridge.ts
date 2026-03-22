import {
  setMarkerInteractionHandler,
  updateMarkerState,
} from "./Marker/Marker.ts"
import type { MarkerInteractionPayload } from "./types.ts"

const SCORE_MARKER_MESSAGE_TYPE = "scoreMarker" as const
const MARKER_SCORE_RESULT_TYPE = "markerScoreResult" as const
const MARKER_SCORE_ERROR_TYPE = "markerScoreError" as const

function isMarkerScoreResultMessage(
  msg: unknown
): msg is {
  type: typeof MARKER_SCORE_RESULT_TYPE
  markerId: string
  score: number
  threshold: number
} {
  if (!msg || typeof msg !== "object") return false
  const m = msg as Record<string, unknown>
  return (
    m.type === MARKER_SCORE_RESULT_TYPE &&
    typeof m.markerId === "string" &&
    typeof m.score === "number" &&
    typeof m.threshold === "number"
  )
}

function isMarkerScoreErrorMessage(
  msg: unknown
): msg is {
  type: typeof MARKER_SCORE_ERROR_TYPE
  markerId?: string
  error: string
} {
  if (!msg || typeof msg !== "object") return false
  const m = msg as Record<string, unknown>
  return (
    m.type === MARKER_SCORE_ERROR_TYPE &&
    typeof m.error === "string" &&
    (m.markerId === undefined || typeof m.markerId === "string")
  )
}

export function registerMarkerScoringBridge(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (isMarkerScoreResultMessage(message)) {
      updateMarkerState(message.markerId, {
        state: "score",
        score: message.score,
        threshold: message.threshold,
      })
      return
    }
    if (isMarkerScoreErrorMessage(message)) {
      if (message.markerId) {
        updateMarkerState(message.markerId, { state: "default" })
      }
      return
    }
  })

  setMarkerInteractionHandler((payload: MarkerInteractionPayload) => {
    updateMarkerState(payload.id, { state: "loading" })
    chrome.runtime.sendMessage(
      {
        type: SCORE_MARKER_MESSAGE_TYPE,
        markerId: payload.id,
        kind: payload.kind,
        data: payload.data,
      },
      () => {
        if (chrome.runtime.lastError) {
          updateMarkerState(payload.id, { state: "default" })
        }
      }
    )
  })
}
