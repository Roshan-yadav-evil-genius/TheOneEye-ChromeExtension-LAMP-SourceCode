import { XPATH_POST } from "../constants.ts"
import { placeScoringButton, removeScoringButton } from "../Marker/Marker.ts"
import type { Post, Profile, ScoringSectionFlags } from "../types.ts"
import {
  collectImgSrcsFromSnapshot,
  xpathFirstNode,
  xpathOrderedSnapshot,
} from "../utils/dom.ts"
import { parseRelativeTimeToDate } from "../utils/time.ts"

export function parsePosts(section: ScoringSectionFlags): Post[] {
  const extractedPosts: Post[] = []
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
      extractedPosts.push({
        publisher: {
          avatar: [],
          name: "",
          url: "",
          headline: "",
        },
        post: {
          content: postBodyHtml,
          image: attachments,
          postedDateIso: null,
        },
      })
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
    } else if (rowCount === 2) {
      rawTimeText =
        xpathFirstNode(
          XPATH_POST.companyShortTime,
          authorWrapper
        )?.textContent?.trim() ?? null
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

    if (section.post) {
      placeScoringButton(postBody, {
        float: false,
        kind: "post",
        data: postData,
      })
    } else {
      removeScoringButton(postBody, { float: false, kind: "post" })
    }

    if (authorWrapper instanceof HTMLElement) {
      if (section.profile) {
        placeScoringButton(authorWrapper, {
          kind: "profile",
          data: publisher,
        })
      } else {
        removeScoringButton(authorWrapper, { kind: "profile" })
      }
    }

    extractedPosts.push(postData)
  }

  return extractedPosts
}
