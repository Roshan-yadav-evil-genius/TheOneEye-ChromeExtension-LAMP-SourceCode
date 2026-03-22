import type { Post, Profile } from "../../Content/types.ts"

export const SCORE_MARKER_MESSAGE_TYPE = "scoreMarker" as const
export const MARKER_SCORE_RESULT_TYPE = "markerScoreResult" as const
export const MARKER_SCORE_ERROR_TYPE = "markerScoreError" as const

export type ScoreMarkerInboundMessage = {
  type: typeof SCORE_MARKER_MESSAGE_TYPE
  markerId: string
  kind: "profile" | "post"
  data: Profile | Post
}

export type TabMarkerScorePayload = {
  markerId: string
  kind: "profile" | "post"
  data: Profile | Post
  score: number
  threshold: number
}
