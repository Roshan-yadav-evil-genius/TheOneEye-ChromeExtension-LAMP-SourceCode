import {
  SCORE_MARKER_MESSAGE_TYPE,
  type ScoreMarkerInboundMessage,
} from "../types/score-marker-messages.ts"

export function isScoreMarkerMessage(
  msg: unknown
): msg is ScoreMarkerInboundMessage {
  if (!msg || typeof msg !== "object") return false
  const m = msg as Record<string, unknown>
  return (
    m.type === SCORE_MARKER_MESSAGE_TYPE &&
    typeof m.markerId === "string" &&
    (m.kind === "profile" || m.kind === "post") &&
    m.data !== null &&
    typeof m.data === "object"
  )
}
