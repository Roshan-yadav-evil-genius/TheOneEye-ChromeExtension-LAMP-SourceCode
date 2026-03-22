import { XPATH_SEARCH_RESULTS_PROFILES } from "../constants.ts"
import { placeScoringButton } from "../Marker.ts"
import type { Profile } from "../types.ts"
import { xpathFirstNode, xpathOrderedSnapshot } from "../utils/dom.ts"
import { isValidLinkedInProfileUrl, tryParseUrl } from "../utils/url.ts"

function extractSearchResultHeadline(profileWrapper: ParentNode): string | null {
  const nameParagraph = xpathFirstNode(
    XPATH_SEARCH_RESULTS_PROFILES.nameLinkParent,
    profileWrapper
  )
  if (!nameParagraph) return null
  const next = nameParagraph.nextSibling
  const text = next?.textContent?.replace(/\s+/g, " ").trim() ?? null
  return text || null
}

export function parseSearchResultsProfiles(): Profile[] {
  const parsedProfiles: Profile[] = []
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

    placeScoringButton(node)

    parsedProfiles.push({
      url: profileIdentifier,
      avatar,
      name,
      headline,
    })
  }

  return parsedProfiles
}
