import type { ParsedMarkerInstruction, Profile } from "../../types.ts"
import { xpathFirstNode, xpathOrderedSnapshot } from "../../utils/dom.ts"
import {
  isValidLinkedInProfileUrl,
  matchesExtensionHost,
  tryParseUrl,
} from "../../utils/url.ts"

const XPATH_SEARCH_RESULTS_PROFILES = {
  profileWrapper: "//a[contains(@href,'/in/') and .//a]",
  profileLink: ".//a[contains(@href,'/in/')]",
  profileImg: ".//img",
  nameLinkParent: ".//a[contains(@href,'/in/')]/parent::p",
} as const

/** Headline text from the sibling node after the name paragraph in a search result card. */
function extractSearchResultHeadline(profileWrapper: ParentNode): string | null {
  const nameParagraph = xpathFirstNode(
    XPATH_SEARCH_RESULTS_PROFILES.nameLinkParent,
    profileWrapper
  )
  if (!nameParagraph) return null
  const next = nameParagraph.parentElement?.nextElementSibling
  const text = next?.textContent?.replace(/\s+/g, " ").trim() ?? null
  return text || null
}

/** People (and mixed) search results pages. */
export function matchesSearchProfilesLocation(loc: Location): boolean {
  return (
    matchesExtensionHost(loc) && loc.pathname.includes("/search/results")
  )
}

/** Extracts profile markers from people (and mixed) LinkedIn search result cards. */
export function parseSearchProfiles(): ParsedMarkerInstruction[] {
  const out: ParsedMarkerInstruction[] = []
  const profiles = xpathOrderedSnapshot(
    XPATH_SEARCH_RESULTS_PROFILES.profileWrapper
  )

  for (let i = 0; i < profiles.snapshotLength; i++) {
    const node = profiles.snapshotItem(i)
    if (!(node instanceof HTMLElement)) continue

    const profileLinkEl = xpathFirstNode(
      XPATH_SEARCH_RESULTS_PROFILES.profileLink,
      node
    )
    const profileHref =
      profileLinkEl instanceof HTMLAnchorElement
        ? profileLinkEl.href
        : null
    const profileUrl = tryParseUrl(profileHref)

    if (!profileUrl || !isValidLinkedInProfileUrl(profileUrl)) continue

    const profileIdentifier = profileUrl.pathname
    const name =
      profileLinkEl instanceof HTMLElement
        ? profileLinkEl.textContent?.replace(/\s+/g, " ").trim() ?? null
        : null

    const imgNode = xpathFirstNode(XPATH_SEARCH_RESULTS_PROFILES.profileImg, node)
    const avatar =
      imgNode instanceof HTMLImageElement && imgNode.src ? [imgNode.src] : []

    const headline = extractSearchResultHeadline(node)

    if (!(profileIdentifier && name && avatar.length && headline)) continue

    const profile: Profile = {
      url: profileIdentifier,
      avatar,
      name,
      headline,
    }

    out.push({ kind: "profile", anchor: node, data: profile })
  }

  return out
}
