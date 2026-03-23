import type { MarkerKind } from "./types.ts"

let busyProfileMarkerId: string | null = null
let busyPostMarkerId: string | null = null

export function clearAutoscoreBusyIfMatches(
  markerId: string,
  kind: MarkerKind
): void {
  if (kind === "profile" && busyProfileMarkerId === markerId) {
    busyProfileMarkerId = null
  }
  if (kind === "post" && busyPostMarkerId === markerId) {
    busyPostMarkerId = null
  }
}

export function setAutoscoreBusyMarkerId(
  kind: MarkerKind,
  markerId: string
): void {
  if (kind === "profile") {
    busyProfileMarkerId = markerId
  } else {
    busyPostMarkerId = markerId
  }
}

export function getAutoscoreBusyMarkerId(kind: MarkerKind): string | null {
  return kind === "profile" ? busyProfileMarkerId : busyPostMarkerId
}
