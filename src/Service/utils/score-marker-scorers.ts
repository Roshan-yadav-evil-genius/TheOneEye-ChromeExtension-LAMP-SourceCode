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

/** Wraps workflow input in the backend’s expected `{ input, timeout }` envelope. */
const TheOneEyeServerCompatiblePayload = (payload: unknown) => ({
  input: payload,
  timeout: 30000,
})

/** Reads error response text/JSON; returns empty string if nothing usable. */
function parseScoreApiHttpErrorDetail(rawText: string): string {
  const trimmed = rawText.trim()
  if (!trimmed) return ""
  try {
    const json = JSON.parse(trimmed) as {
      error?: unknown
      message?: unknown
      detail?: unknown
    }
    const serverMsg =
      (typeof json.error === "string" && json.error.trim()) ||
      (typeof json.message === "string" && json.message.trim()) ||
      (typeof json.detail === "string" && json.detail.trim())
    if (serverMsg) return serverMsg
  } catch {
    /* not JSON — use raw snippet */
  }
  return trimmed.slice(0, 500)
}

/**
 * POSTs to The One Eye workflow execute endpoint and returns a 0–100 integer score.
 *
 * @remarks Network fetch; throws on non-OK HTTP or invalid JSON score; normalizes backend 0..1 to 0..100.
 */
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
    const rawText = await response.text()
    let detail = parseScoreApiHttpErrorDetail(rawText)
    if (!detail) {
      detail = response.statusText?.trim() || `HTTP ${response.status}`
    }
    const safeDetail = detail.replace(/\s+/g, " ").trim().slice(0, 280)
    throw new Error(
      `score_api_http_${response.status}:${safeDetail || "request_failed"}`
    )
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
 * Runs the profile scoring workflow using the enriched Voyager + DOM payload.
 *
 * @remarks Network: same as executeScoringWorkflow for PROFILE_WORKFLOW_ID.
 */
export async function scoreLinkedInProfile(
  profilePayload: EnrichedLinkedInProfilePayload
): Promise<number> {
  return executeScoringWorkflow(PROFILE_WORKFLOW_ID, profilePayload)
}

/**
 * Runs the post scoring workflow with post data and intention fields.
 *
 * @remarks `settings` is accepted for API symmetry; post workflow input uses data + intention only. Network fetch.
 */
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
