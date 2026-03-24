import type { Profile } from "../types.ts"
import { getIntentionFromChrome } from "../../shared/get-intention-from-chrome.ts"
import {
  getScoringSettingsFromChrome,
  type ScoringSettingsBundle,
} from "../../shared/get-scoring-settings-from-chrome.ts"
import {
  ACTIVITY_REQUEST_TYPES,
  getEnabledActivityRequestTypes,
} from "./activity-request-types.ts"
import { fetchActivityByQueryId } from "./activity-voyager-api.ts"
import {
  fetchProfileVoyagerData,
  getProfileUrnFromVoyagerResponse,
} from "./profile-voyager-api.ts"
import type { EnrichedLinkedInProfilePayload } from "./types.ts"

function extractPublicIdentifierFromProfileUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/^\/in\/([^/]+)/i)
    return match?.[1] ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

function toActivityReferer(publicIdentifier: string, refererSuffix: string): string {
  return `https://www.linkedin.com/in/${publicIdentifier}/recent-activity/${refererSuffix}/`
}

function getProfileUrnOrThrow(profileResponse: unknown): string {
  const profileUrn = getProfileUrnFromVoyagerResponse(profileResponse)
  if (!profileUrn) {
    throw new Error("profile_urn_missing")
  }
  return profileUrn
}

async function fetchProfileForActivityDependency(
  publicIdentifier: string
): Promise<unknown> {
  return fetchProfileVoyagerData(publicIdentifier)
}

export async function buildEnrichedLinkedInProfilePayloadForContent(
  raw: Profile
): Promise<EnrichedLinkedInProfilePayload> {
  const [settings, intention] = await Promise.all([
    getScoringSettingsFromChrome(),
    getIntentionFromChrome(),
  ])

  return buildEnrichedLinkedInProfilePayload(raw, intention, settings)
}

export async function buildEnrichedLinkedInProfilePayload(
  raw: Profile,
  intention: EnrichedLinkedInProfilePayload["intention"],
  settings: ScoringSettingsBundle
): Promise<EnrichedLinkedInProfilePayload> {
  const publicIdentifier = extractPublicIdentifierFromProfileUrl(raw.url)
  if (!publicIdentifier) {
    throw new Error("profile_identifier_missing")
  }

  const api: EnrichedLinkedInProfilePayload["api"] = {}

  let profileResponseForUrn: unknown | null = null
  if (settings.profile.about) {
    console.log("fetching profile voyager data for", publicIdentifier)
    profileResponseForUrn = await fetchProfileVoyagerData(publicIdentifier)
    api.profile = profileResponseForUrn
  }

  const enabledActivityTypes = getEnabledActivityRequestTypes(settings.profile)
  if (enabledActivityTypes.length > 0) {
    if (!profileResponseForUrn) {
      profileResponseForUrn = await fetchProfileForActivityDependency(publicIdentifier)
    }
    const profileUrn = getProfileUrnOrThrow(profileResponseForUrn)

    for (const activityType of ACTIVITY_REQUEST_TYPES) {
      const enabledRequest = enabledActivityTypes.find(
        (item) => item.key === activityType.key
      )
      if (!enabledRequest) continue

      const referer = toActivityReferer(publicIdentifier, enabledRequest.refererSuffix)
      console.log("fetching activity by query id for", publicIdentifier, enabledRequest.key)
      try {
        api[enabledRequest.key] = await fetchActivityByQueryId(
          profileUrn,
          enabledRequest.queryId,
          { referer }
        )
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error)
        throw new Error(`activity_${enabledRequest.key}_failed:${details}`)
      }
    }
  }

  return {
    raw,
    api,
    intention,
    settings,
  }
}
