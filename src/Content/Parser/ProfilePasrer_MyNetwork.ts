import { XPATH_MYNETWORK } from "../constants.ts"
import { placeScoringButton } from "../Marker.ts"
import type { Profile } from "../types.ts"
import { xpathFirstNode, xpathOrderedSnapshot } from "../utils/dom.ts"
import { extractDirectTextList } from "../utils/text.ts"
import { isValidLinkedInProfileUrl } from "../utils/url.ts"

export function parseMyNetworkProfiles(): Profile[] {
  const parsedProfiles: Profile[] = []
  const profiles = xpathOrderedSnapshot(XPATH_MYNETWORK.profile)

  for (let i = 0; i < profiles.snapshotLength; i++) {
    const node = profiles.snapshotItem(i)
    if (!(node instanceof HTMLElement)) continue

    const profileNode = xpathFirstNode(XPATH_MYNETWORK.profile_link, node)
    if (!(profileNode instanceof HTMLAnchorElement)) continue

    let profileUrl: URL
    try {
      profileUrl = new URL(profileNode.href)
    } catch {
      continue
    }

    if (!isValidLinkedInProfileUrl(profileUrl)) continue

    const profileIdentifier = profileUrl.pathname

    const avatarAndCover: string[] = []
    const profileAvatarAndCover = xpathOrderedSnapshot(
      XPATH_MYNETWORK.avatarImg,
      profileNode
    )
    for (let j = 0; j < profileAvatarAndCover.snapshotLength; j++) {
      const avatarNode = profileAvatarAndCover.snapshotItem(j)
      if (avatarNode instanceof HTMLImageElement) {
        avatarAndCover.push(avatarNode.src)
      }
    }

    const textList = extractDirectTextList(profileNode)

    let profileName: string | null = null
    let profileHeadline: string | null = null
    if (textList.length === 3) {
      profileName = textList[1] ?? null
      profileHeadline = textList[2] ?? null
    }

    if (!(profileUrl.pathname && profileName && profileHeadline)) continue

    placeScoringButton(node)

    parsedProfiles.push({
      url: profileIdentifier,
      avatar: avatarAndCover,
      name: profileName,
      headline: profileHeadline,
    })
  }

  return parsedProfiles
}
