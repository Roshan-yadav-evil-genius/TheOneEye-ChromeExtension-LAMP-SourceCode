export interface Profile {
  url: string
  avatar: string[]
  name: string
  headline: string
}

export interface Post {
  publisher: Profile
  post: {
    content: string | null
    image: string[],
    postedDateIso: string | null
  }
}

export interface LinkedInParseResult {
  mynetworkProfiles: Profile[]
  recommendedProfiles: Profile[]
  searchResultsProfiles: Profile[]
  posts: Post[]
}
