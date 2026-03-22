export function parseRelativeTimeToDate(timeText: string | null): Date | null {
  if (!timeText) return null

  const relativePart = timeText.split("•")[0]?.trim() ?? ""
  const match = relativePart.match(/(\d+)([smhdw]|mo|yr)/)

  if (!match) return null

  const amount = Number.parseInt(match[1]!, 10)
  const unit = match[2]!

  const date = new Date()

  switch (unit) {
    case "s":
      date.setSeconds(date.getSeconds() - amount)
      break
    case "m":
      date.setMinutes(date.getMinutes() - amount)
      break
    case "h":
      date.setHours(date.getHours() - amount)
      break
    case "d":
      date.setDate(date.getDate() - amount)
      break
    case "w":
      date.setDate(date.getDate() - amount * 7)
      break
    case "mo":
      date.setMonth(date.getMonth() - amount)
      break
    case "yr":
      date.setFullYear(date.getFullYear() - amount)
      break
    default:
      return null
  }

  return date
}
