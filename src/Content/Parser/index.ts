import type { LinkedInParseResult, ScoringSectionFlags } from "../types.ts"
import { parsePosts } from "./PostParser.ts"
import { parseMyNetworkProfiles } from "./ProfilePasrer_MyNetwork.ts"
import { parseRecommendedProfiles } from "./ProfilePasrer_ProfilePage.ts"
import { parseSearchResultsProfiles } from "./ProfileParser_SearchResult.ts"

export { parseMyNetworkProfiles } from "./ProfilePasrer_MyNetwork.ts"
export { parseRecommendedProfiles } from "./ProfilePasrer_ProfilePage.ts"
export { parseSearchResultsProfiles } from "./ProfileParser_SearchResult.ts"
export { parsePosts } from "./PostParser.ts"

export function runAllLinkedInParsers(
  section: ScoringSectionFlags
): LinkedInParseResult {
  return {
    mynetworkProfiles: parseMyNetworkProfiles(section),
    recommendedProfiles: parseRecommendedProfiles(section),
    searchResultsProfiles: parseSearchResultsProfiles(section),
    posts: parsePosts(section),
  }
}
