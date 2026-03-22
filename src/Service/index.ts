/**
 * Extension service worker (Manifest V3). Event-driven; avoid assuming a long-lived process.
 */
import { registerScoreMarkerListener } from "./scoreMarkerHandler.ts"

registerScoreMarkerListener()

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // First install
  }
})
