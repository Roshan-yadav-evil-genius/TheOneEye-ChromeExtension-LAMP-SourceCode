import { normalizeLinkedInProfileUrl } from "@/lib/linkedin-profile-url"

/**
 * Opens a URL in a new browser tab (extension popup context).
 * Relies on host_permissions for the target origin.
 */
export function openUrlInNewTab(raw: string): void {
  if (typeof chrome === "undefined" || !chrome.tabs?.create) return
  const url = normalizeLinkedInProfileUrl(raw)
  if (!url) return
  void chrome.tabs.create({ url, active: false })
}
