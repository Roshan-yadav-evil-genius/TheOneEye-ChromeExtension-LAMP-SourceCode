/**
 * Recommended feed profile cards (two /in/ links, avatar or ghost name).
 * Dedicated /in/... profile page parsing can be added here or in a separate module later.
 */
import { XPATH_RECOMMENDED } from "../constants.ts"
import { placeScoringButton, removeScoringButton } from "../Marker/Marker.ts"
import type { Profile, ScoringSectionFlags } from "../types.ts"
import { xpathFirstNode, xpathOrderedSnapshot } from "../utils/dom.ts"
import { isValidLinkedInProfileUrl } from "../utils/url.ts"

export function parseRecommendedProfiles(
  section: ScoringSectionFlags
): Profile[] {
  const parsedProfiles: Profile[] = []
  const profiles = xpathOrderedSnapshot(XPATH_RECOMMENDED.profile)

  for (let i = 0; i < profiles.snapshotLength; i++) {
    const node = profiles.snapshotItem(i)
    if (!(node instanceof HTMLElement)) continue

    const links = xpathOrderedSnapshot(XPATH_RECOMMENDED.links, node)
    let profileIdentifier: string | null = null

    for (let j = 0; j < links.snapshotLength; j++) {
      const link = links.snapshotItem(j)
      if (!(link instanceof HTMLAnchorElement)) continue
      let url: URL
      try {
        url = new URL(link.href)
      } catch {
        continue
      }
      if (isValidLinkedInProfileUrl(url)) {
        profileIdentifier = url.pathname
        break
      }
    }

    if (!profileIdentifier) continue

    const avatarAndCover: string[] = []
    const avatarNode = xpathFirstNode(XPATH_RECOMMENDED.avatarImg, node)
    const imgEl =
      avatarNode instanceof HTMLImageElement ? avatarNode : null
    if (imgEl) avatarAndCover.push(imgEl.src)

    let name: string | null = imgEl?.alt ?? null

    if (!imgEl) {
      const ghost = xpathFirstNode(XPATH_RECOMMENDED.ghostName, node)
      name =
        ghost?.textContent?.replace(/\s+/g, " ").trim() ?? null
    }

    const headlineNode = xpathFirstNode(XPATH_RECOMMENDED.headline, node)
    const headline = headlineNode?.textContent?.trim() ?? null

    if (!(profileIdentifier && name && headline)) continue

    const profile: Profile = {
      url: profileIdentifier,
      avatar: avatarAndCover,
      name,
      headline,
    }

    if (section.profile) {
      placeScoringButton(node, { kind: "profile", data: profile })
    } else {
      removeScoringButton(node, { kind: "profile" })
    }
    parsedProfiles.push(profile)
  }

  return parsedProfiles
}
