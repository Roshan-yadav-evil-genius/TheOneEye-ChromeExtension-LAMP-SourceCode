/** Trims a keyword/headline tag and strips stray leading/trailing commas. */
export function normalizeIntentionTag(raw: string): string {
  return raw.trim().replace(/^,+|,+$/g, "").trim()
}

/** Splits bulk input (paste or typed) into separate tags by comma or line break. */
export function splitIntentionInputSegments(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
