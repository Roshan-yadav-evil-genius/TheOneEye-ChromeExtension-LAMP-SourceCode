/**
 * Normalizes a stored LinkedIn profile URL for opening or exporting.
 * Returns null when the value is empty after trim.
 */
export function normalizeLinkedInProfileUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith("/")) return `https://www.linkedin.com${trimmed}`
  return `https://${trimmed}`
}
