import type { Post, Profile } from "../../Content/types.ts"
import type { EnrichedLinkedInProfilePayload } from "../../Content/VoyagerApi/types.ts"

export const SCORE_MARKER_MESSAGE_TYPE = "scoreMarker" as const
export const MARKER_SCORE_RESULT_TYPE = "markerScoreResult" as const
export const MARKER_SCORE_ERROR_TYPE = "markerScoreError" as const

export type ScoreMarkerInboundMessage = {
  type: typeof SCORE_MARKER_MESSAGE_TYPE
  markerId: string
  kind: "profile" | "post"
  data: Profile | Post
  enrichedProfile?: EnrichedLinkedInProfilePayload
}

export type TabMarkerScorePayload = {
  markerId: string
  kind: "profile" | "post"
  data: Profile | Post
  score: number
  threshold: number
}
