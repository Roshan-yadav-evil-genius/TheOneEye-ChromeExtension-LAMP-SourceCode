import type { Post, Profile } from "../../Content/types.ts"

/** Placeholder: replace with real profile scoring. */
export function scoreLinkedInProfile(_data: Profile): number {
  return Math.floor(Math.random() * 101)
}

/** Placeholder: replace with real post scoring. */
export function scoreLinkedInPost(_data: Post): number {
  return Math.floor(Math.random() * 101)
}
