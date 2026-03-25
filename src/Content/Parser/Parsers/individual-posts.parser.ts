import type { ParsedMarkerInstruction, Post, Profile } from "../../types.ts"
import {
  collectImgSrcsFromSnapshot,
  xpathFirstNode,
  xpathOrderedSnapshot,
} from "../../utils/dom.ts"
import { parseRelativeTimeToDate } from "../../utils/time.ts"
import { matchesExtensionHost } from "../../utils/url.ts"

const XPATH_POST = {
  container:
    "//div[count(a[contains(@href,'/in/')]) = 2]/parent::div[*[1][self::h2] and *[2][self::div] and p ]",
  postBody: "./p",
  authorProfileLink: "./a[1]",
  authorProfileImg: "./a[1]//img",
  authorName: "./a[2]/div/div[1]//p",
  authorRows: "./a[2]/div/div",
  individualHeadline: "./a[2]/div/div[2]/p",
  individualTime: "./a[2]/div/div[3]/p",
  companyShortTime: "./a[2]/div/div[2]/p",
} as const

/** Home / feed routes; XPath only matches real feed update rows. */
export function matchesFeedPostsLocation(loc: Location): boolean {
  if (!matchesExtensionHost(loc)) return false
  const p = loc.pathname.replace(/\/+$/, "") || "/"
  const feed_page = p.includes("feed")
  const search_page = p.includes("/search/results")

  return feed_page || search_page
}

/** Extracts feed post and author profile markers from the home/feed DOM via XPath. */
export function parseFeedPosts(): ParsedMarkerInstruction[] {
  const out: ParsedMarkerInstruction[] = []
  const postNodes = xpathOrderedSnapshot(XPATH_POST.container)

  for (let i = 0; i < postNodes.snapshotLength; i++) {
    const postNode = postNodes.snapshotItem(i)
    if (!(postNode instanceof HTMLElement)) continue

    const postBodyNode = xpathFirstNode(XPATH_POST.postBody, postNode)
    const postBody =
      postBodyNode instanceof HTMLElement ? postBodyNode : null
    const authorWrapper = postBody?.previousElementSibling ?? null

    const postBodyHtml = postBody?.outerHTML ?? null
    const nextElement = postBody?.nextElementSibling ?? null
    const attachments = nextElement
      ? collectImgSrcsFromSnapshot(xpathOrderedSnapshot(".//img", nextElement))
      : []

    if (!authorWrapper) {
      continue
    }

    const authorLink = xpathFirstNode(
      XPATH_POST.authorProfileLink,
      authorWrapper
    )
    const profileUrl =
      authorLink instanceof HTMLAnchorElement ? authorLink.href : null

    const authorImg = xpathFirstNode(
      XPATH_POST.authorProfileImg,
      authorWrapper
    )
    const profileImage =
      authorImg instanceof HTMLImageElement ? authorImg.src : null

    const nameNode = xpathFirstNode(XPATH_POST.authorName, authorWrapper)
    const profileName = nameNode?.textContent?.trim() ?? null

    const rowCount = xpathOrderedSnapshot(
      XPATH_POST.authorRows,
      authorWrapper
    ).snapshotLength

    let profileHeadline: string | null = null
    let rawTimeText: string | null = null

    if (rowCount >= 3) {
      if (profileUrl?.includes("/in/")) {
        profileHeadline =
          xpathFirstNode(
            XPATH_POST.individualHeadline,
            authorWrapper
          )?.textContent?.trim() ?? null
        rawTimeText =
          xpathFirstNode(XPATH_POST.individualTime, authorWrapper)?.textContent?.trim() ??
          null
      }
    }

    const postedDate = parseRelativeTimeToDate(rawTimeText)
    const postedDateIso = postedDate?.toISOString() ?? null

    const publisher: Profile = {
      avatar: profileImage ? [profileImage] : [],
      name: profileName ?? "",
      url: profileUrl ?? "",
      headline: profileHeadline ?? "",
    }

    const postData: Post = {
      publisher,
      post: {
        content: postBodyHtml,
        image: attachments,
        postedDateIso: postedDateIso,
      },
    }

    if (!(profileUrl && profileName && postBody)) continue

    out.push({
      kind: "post",
      anchor: postBody,
      data: postData,
      float: false,
    })

    if (authorWrapper instanceof HTMLElement) {
      out.push({
        kind: "profile",
        anchor: authorWrapper,
        data: publisher,
      })
    }
  }

  return out
}
