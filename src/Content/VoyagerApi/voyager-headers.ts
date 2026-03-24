function getJsessionIdFromCookie(): string {
  const cookies = document.cookie
    .split("; ")
    .reduce<Record<string, string>>((acc, c) => {
      const [k, v] = c.split("=")
      if (k && v) acc[k] = v
      return acc
    }, {})
  return (cookies["JSESSIONID"] ?? "").replace(/"/g, "")
}

export function buildVoyagerHeaders(options?: {
  referer?: string
}): Record<string, string> {
  const jsessionid = getJsessionIdFromCookie()
  const userAgent = navigator.userAgent
  const acceptLanguage = navigator.languages
    ? navigator.languages.join(",")
    : navigator.language

  let secChUa = ""
  let secChUaMobile = "?0"
  let secChUaPlatform = ""
  const uaData = (navigator as Navigator & {
    userAgentData?: {
      brands: { brand: string; version: string }[]
      mobile?: boolean
      platform?: string
    }
  }).userAgentData
  if (uaData) {
    secChUa = uaData.brands
      .map((b) => `"${b.brand}";v="${b.version}"`)
      .join(", ")
    secChUaMobile = uaData.mobile ? "?1" : "?0"
    secChUaPlatform = `"${uaData.platform ?? ""}"`
  }

  return {
    accept: "application/vnd.linkedin.normalized+json+2.1",
    "accept-language": acceptLanguage,
    "csrf-token": jsessionid,
    priority: "u=1, i",
    referer: options?.referer ?? window.location.href,
    "sec-ch-prefers-color-scheme": "light",
    "sec-ch-ua": secChUa,
    "sec-ch-ua-mobile": secChUaMobile,
    "sec-ch-ua-platform": secChUaPlatform,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": userAgent,
    "x-li-lang": "en_US",
    "x-restli-protocol-version": "2.0.0",
  }
}
