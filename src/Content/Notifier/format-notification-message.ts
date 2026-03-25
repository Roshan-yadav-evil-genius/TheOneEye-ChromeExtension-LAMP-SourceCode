/**
 * Maps internal / backend error text to short, safe copy for in-page toasts.
 * Detailed errors remain in console logs at call sites.
 */
export function formatScoreServiceError(raw: string): string {
  const t = raw.trim()
  if (!t) return "Something went wrong while scoring."

  const apiDetail = /^score_api_http_\d+:(.+)$/.exec(t)
  if (apiDetail) {
    const msg = apiDetail[1].trim()
    if (msg && msg !== "request_failed") return msg
  }

  const lower = t.toLowerCase()
  if (lower.includes("no_tab")) {
    return "Couldn’t reach this page. Try again."
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network issue. Check your connection and try again."
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Request timed out. Try again."
  }

  return "Couldn’t score this. Try again."
}

/** User-facing copy when Voyager/profile enrichment fails before sendMessage. */
export function formatScoreEnrichmentError(): string {
  return "Couldn’t load profile data for scoring. Try again."
}

/** User-facing copy when chrome.runtime.sendMessage fails (e.g. extension context). */
export function formatScoreRuntimeError(): string {
  return "Couldn’t reach Lamp. Try reloading the page."
}
