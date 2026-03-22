import type { Profile } from "../../Content/types.ts"

import { copyTextToClipboard } from "@/lib/copy-text-clipboard"
import { escapeCsvCell } from "@/lib/csv-escape-cell"
import { normalizeLinkedInProfileUrl } from "@/lib/linkedin-profile-url"

/** Header row plus one line per profile: name,link */
export function buildQualifiedProfilesCsv(profiles: Profile[]): string {
  const lines = ["name,link"]
  for (const p of profiles) {
    const link = normalizeLinkedInProfileUrl(p.url) ?? ""
    lines.push(`${escapeCsvCell(p.name)},${escapeCsvCell(link)}`)
  }
  return lines.join("\n")
}

export async function copyQualifiedProfilesCsvToClipboard(
  profiles: Profile[]
): Promise<void> {
  await copyTextToClipboard(buildQualifiedProfilesCsv(profiles))
}
