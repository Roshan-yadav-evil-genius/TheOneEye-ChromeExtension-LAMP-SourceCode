import { runAllLinkedInParsers } from "./Parser/index.ts"

let linkedInPageScanTimerId: ReturnType<typeof setInterval> | null = null

export function startLinkedInPageScan(intervalMs = 1000): ReturnType<
  typeof setInterval
> {
  stopLinkedInPageScan()
  runAllLinkedInParsers()
  linkedInPageScanTimerId = setInterval(runAllLinkedInParsers, intervalMs)
  return linkedInPageScanTimerId
}

export function stopLinkedInPageScan(): void {
  if (linkedInPageScanTimerId != null) {
    clearInterval(linkedInPageScanTimerId)
    linkedInPageScanTimerId = null
  }
}
