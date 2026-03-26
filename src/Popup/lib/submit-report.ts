import type { ReportIssuePayload } from "@/types/extension-settings"
import { WORKFLOW_API_BASE_URL } from "../../shared/api-config.ts"

const REPORT_API_BASE = WORKFLOW_API_BASE_URL
const REPORT_WORKFLOW_ID = "1771881b-6d1e-4b5d-b645-5df14e0374d1"

const REPORT_API_HEADERS = {
  "Content-Type": "application/json",
  Authorization: "Api-Key PjLdurRlGML4dxrTH-hJew0j-rgJ2MwWzDBRczrrlRs",
} as const

/** Wraps report payload for workflow execute API shape. */
const toTheOneEyeServerPayload = (payload: unknown) => ({
  input: payload,
  timeout: 30000,
})

async function getCurrentPageUrl(): Promise<string> {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
    return activeTab?.url ?? ""
  } catch (error) {
    console.warn("[Lamp] failed to read active tab URL", error)
    return ""
  }
}

/**
 * Submits a user report to The One Eye workflow API and returns the server message string.
 *
 * @remarks Network POST; throws on HTTP or invalid response body.
 */
export async function submitReportIssue(
  payload: ReportIssuePayload
): Promise<string> {
  const currentPageUrl = await getCurrentPageUrl()
  const requestBody = toTheOneEyeServerPayload({
    reported_issue: payload.description,
    current_page_url: currentPageUrl,
    source: "LAMP Chrome Extension",
  })

  const response = await fetch(
    `${REPORT_API_BASE}/${REPORT_WORKFLOW_ID}/execute/`,
    {
      method: "POST",
      headers: REPORT_API_HEADERS,
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    throw new Error(`report_api_http_${response.status}`)
  }

  const responseBody = (await response.json()) as { msg?: unknown }
  if (typeof responseBody.msg !== "string" || responseBody.msg.length === 0) {
    throw new Error("report_api_invalid_response")
  }

  return responseBody.msg
}
