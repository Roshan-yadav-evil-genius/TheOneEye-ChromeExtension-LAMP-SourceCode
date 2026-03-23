import type { Post, Profile } from "../../Content/types.ts"
import type { ScoringIntentionSnapshot } from "../../shared/get-intention-from-chrome.ts"
import type { ScoringSettingsBundle } from "../../shared/get-scoring-settings-from-chrome.ts"

/** Placeholder: replace with real profile scoring. */
export function scoreLinkedInProfile(
  data: Profile,
  intention: ScoringIntentionSnapshot,
  settings: ScoringSettingsBundle
): number {
  const payload ={
    data,
    intention,
  }
  void settings
  console.log("scoreLinkedInProfile", payload)
  return Math.floor(Math.random() * 101)
}

const TheOneEyeServerCompatiblePayload = (payload:any)=>{
  return {
    input:payload,
    timeout:30000,
  }
}

/** Placeholder: replace with real post scoring. */
export async function scoreLinkedInPost(
  data: Post,
  intention: ScoringIntentionSnapshot,
  settings: ScoringSettingsBundle
): Promise<number> {
  const _payload ={
    data,
    intention:{objective:intention.postDescription,Keywords:intention.keywords},
  }
  void settings

  const payload = TheOneEyeServerCompatiblePayload(_payload)

  const response = await fetch("http://127.0.0.1:7878/api/workflow/f141f826-c899-4d2b-83d6-300b0e8eb02d/execute/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Api-Key PjLdurRlGML4dxrTH-hJew0j-rgJ2MwWzDBRczrrlRs",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`score_api_http_${response.status}`)
  }

  const responseBody = (await response.json()) as { score?: unknown }
  console.log("scoreLinkedInPost", responseBody)
  if (typeof responseBody.score !== "number" || Number.isNaN(responseBody.score)) {
    throw new Error("score_api_invalid_response")
  }

  // Backend returns score in 0..1. Convert to extension's 0..100 range.
  const normalizedScore = Math.round(responseBody.score * 100)
  return Math.max(0, Math.min(100, normalizedScore))
}
