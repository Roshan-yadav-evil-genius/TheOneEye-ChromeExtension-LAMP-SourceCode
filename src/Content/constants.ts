export const THE_ONE_EYE_MARKER_CLASS = "TheOneEyeMarker"

export const XPATH_MYNETWORK = {
  profile: "//div[a[contains(@href,'/in/')]]",
  profile_link: ".//a[contains(@href,'/in/')]",
  avatarImg: ".//img",
} as const

export const XPATH_RECOMMENDED = {
  profile:
    "//div[   count(.//a[contains(@href,'/in/')]) = 2   and   .//a[contains(@href,'/in/')][.//img or .//div[contains(@class,'ghost-person')]]   and   not(.//div[     count(.//a[contains(@href,'/in/')]) = 2     and     .//a[contains(@href,'/in/')][.//img or .//div[contains(@class,'ghost-person')]]   ]) ]",
  links: ".//a[contains(@href,'/in/')]",
  avatarImg: ".//a[contains(@href,'/in/')][1]//img",
  ghostName:
    ".//a[contains(@href,'/in/')][1]//div[contains(@class,'ghost-person')]",
  headline:
    ".//a[contains(@href,'/in/') and not(.//img or .//div[contains(@class,'ghost-person')])]/*[2]",
} as const

export const XPATH_POST = {
  container:
    "//div[count(a[contains(@href,'/in/')]) = 2]/parent::div[*[1][self::h2] and *[2][self::div] and p ]",
  postBody: "./p",
  authorProfileLink: "./a[1]",
  authorProfileImg: "./a[1]//img",
  authorName: "./a[2]/div/div[1]//p",
  authorRows: "./a[2]/div/div",
  individualHeadline: "./a[2]/div/div[2]/p",
  individualTime: "./a[2]/div/div[3]/p",
  companyFollowers: "./a[2]/div/div[2]/p",
  companyTime: "./a[2]/div/div[3]/p",
  companyShortTime: "./a[2]/div/div[2]/p",
} as const

export const XPATH_SEARCH_RESULTS_PROFILES = {
  profileWrapper: "//a[contains(@href,'/in/') and .//a]",
  profileLink: ".//a[contains(@href,'/in/')]",
  profileImg: ".//img",
  nameLinkParent: ".//a[contains(@href,'/in/')]/parent::p",
} as const
