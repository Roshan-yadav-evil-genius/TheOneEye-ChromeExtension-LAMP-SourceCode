import type { ParsedMarkerInstruction, Profile } from "../../types.ts"
import { xpathFirstNode, xpathOrderedSnapshot } from "../../utils/dom.ts"
import { isValidLinkedInProfileUrl, matchesExtensionHost } from "../../utils/url.ts"

/**
 * Recommended feed profile cards (two /in/ links, avatar or ghost name).
 * XPath co-located with this parser.
 */
const XPATH_RECOMMENDED = {
  profile:
    "//div[   count(.//a[contains(@href,'/in/')]) = 2   and   .//a[contains(@href,'/in/')][.//figure]   and   not(.//div[     count(.//a[contains(@href,'/in/')]) = 2     and     .//a[contains(@href,'/in/')][.//figure]   ]) ]",
  links: ".//a[contains(@href,'/in/')]",
  avatarImg: ".//img",
  name:
    "./a[contains(@href,'/in/')]//a[contains(@href,'/in/')]",
  headline:
    "./a[contains(@href,'/in/')]/div/div/div[2]",
} as const

/** Main feed / home where recommended people cards appear. */
export function matchesFeedRecommendedLocation(loc: Location): boolean {
  if (!matchesExtensionHost(loc)) return false
  const p = loc.pathname.replace(/\/+$/, "") || "/"
  const profile_page = p.includes("/in")
  return profile_page
}

/** Extracts “recommended for you” profile card markers from the main feed DOM. */
export function parseRecommendedProfiles(): ParsedMarkerInstruction[] {
  const out: ParsedMarkerInstruction[] = []
  const profiles = xpathOrderedSnapshot(XPATH_RECOMMENDED.profile)

  for (let i = 0; i < profiles.snapshotLength; i++) {
    const node = profiles.snapshotItem(i)
    if (!(node instanceof HTMLElement)) continue

    const link = xpathFirstNode(XPATH_RECOMMENDED.links, node)

    if (!(link instanceof HTMLAnchorElement)) continue

    const url = new URL(link.href)
    
    if (!isValidLinkedInProfileUrl(url)) continue
    const profileIdentifier = url.pathname

    if (!profileIdentifier) continue

    const avatarAndCover: string[] = []
    const avatarNode = xpathFirstNode(XPATH_RECOMMENDED.avatarImg, node)
    const imgEl =
      avatarNode instanceof HTMLImageElement ? avatarNode : null
    if (imgEl) avatarAndCover.push(imgEl.src)

    let name: string | null = xpathFirstNode(XPATH_RECOMMENDED.name, node)?.textContent?.trim() ?? null


    const headlineNode = xpathFirstNode(XPATH_RECOMMENDED.headline, node)
    if (!(headlineNode instanceof HTMLElement)) continue

    const headline = headlineNode?.textContent?.trim() ?? null
    if (!(profileIdentifier && name && headline)){
      continue
    }

    const profile: Profile = {
      url: profileIdentifier,
      avatar: avatarAndCover,
      name,
      headline,
    }

    out.push({ kind: "profile", anchor: link, data: profile })
  }

  return out
}
