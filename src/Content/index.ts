/**
 * Runs in page contexts matched by manifest `content_scripts`.
 * Keep this entry self-contained to avoid extra chunk files in the extension package.
 */
import { registerMarkerScoringBridge } from "./marker-scoring-bridge.ts"
import { startLinkedInPageScan } from "./scanner.ts"

function init(): void {
  if (!location.hostname.endsWith("linkedin.com")) return
  registerMarkerScoringBridge()
  startLinkedInPageScan()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true })
} else {
  init()
}
