export type NotifierType = "info" | "error" | "success" | "warning"

export const NOTIFIER_TYPES = [
  "info",
  "error",
  "success",
  "warning",
] as const satisfies readonly NotifierType[]
