import type { Post } from "../../Content/types.ts"
import type { EnrichedLinkedInProfilePayload } from "../../Content/VoyagerApi/types.ts"
import type { ScoringIntentionSnapshot } from "../../shared/get-intention-from-chrome.ts"
import type { ScoringSettingsBundle } from "../../shared/get-scoring-settings-from-chrome.ts"

const SCORE_API_BASE = "http://127.0.0.1:7878/api/workflow"
const POST_WORKFLOW_ID = "f141f826-c899-4d2b-83d6-300b0e8eb02d"
const PROFILE_WORKFLOW_ID = "26f0a457-b6d6-47fe-bea1-b991d097d48e"

const SCORE_API_HEADERS = {
  "Content-Type": "application/json",
  Authorization: "Api-Key PjLdurRlGML4dxrTH-hJew0j-rgJ2MwWzDBRczrrlRs",
} as const

const TheOneEyeServerCompatiblePayload = (payload: unknown) => ({
  input: payload,
  timeout: 30000,
})

async function executeScoringWorkflow(
  workflowId: string,
  input: unknown
): Promise<number> {
  const body = TheOneEyeServerCompatiblePayload(input)
  const startedAt = Date.now()
  console.log("[SCORE][API] workflow request start", {
    workflowId,
    url: `${SCORE_API_BASE}/${workflowId}/execute/`,
    body,
  })
  const response = await fetch(
    `${SCORE_API_BASE}/${workflowId}/execute/`,
    {
      method: "POST",
      headers: SCORE_API_HEADERS,
      body: JSON.stringify(body),
    }
  )
  console.log("[SCORE][API] workflow response received", {
    workflowId,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    durationMs: Date.now() - startedAt,
    response,
  })
  if (!response.ok) {
    throw new Error(`score_api_http_${response.status}`)
  }

  const responseBody = (await response.json()) as { score?: unknown }
  console.log("[SCORE][API] workflow response body parsed", {
    workflowId,
    responseBody,
  })
  if (
    typeof responseBody.score !== "number" ||
    Number.isNaN(responseBody.score)
  ) {
    throw new Error("score_api_invalid_response")
  }

  // Backend returns score in 0..1. Convert to extension's 0..100 range.
  const normalizedScore = Math.round(responseBody.score * 100)
  const clampedScore = Math.max(0, Math.min(100, normalizedScore))
  console.log("[SCORE][API] normalized score", {
    workflowId,
    rawScore: responseBody.score,
    normalizedScore,
    clampedScore,
  })
  return clampedScore
}

/**
 * Sends the full enriched profile payload as workflow `input` (wrapped by
 * TheOneEyeServerCompatiblePayload).
 */
export async function scoreLinkedInProfile(
  profilePayload: EnrichedLinkedInProfilePayload
): Promise<number> {
  return executeScoringWorkflow(PROFILE_WORKFLOW_ID, profilePayload)
}

export async function scoreLinkedInPost(
  data: Post,
  intention: ScoringIntentionSnapshot,
  settings: ScoringSettingsBundle
): Promise<number> {
  const input = {
    data,
    intention: {
      objective: intention.postDescription,
      Keywords: intention.keywords,
    },
  }
  void settings

  return executeScoringWorkflow(POST_WORKFLOW_ID, input)
}
