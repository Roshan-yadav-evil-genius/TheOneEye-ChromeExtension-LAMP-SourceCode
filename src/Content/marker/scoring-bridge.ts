import { appendDashboardThresholdHit } from "../dashboard/append-threshold-hit.ts"
import {
  MARKER_KIND_ATTRIBUTE,
  setMarkerInteractionHandler,
  setProfileMarkerPlacedHandler,
  updateMarkerState,
} from "./marker.ts"
import {
  formatScoreServiceError,
  notifyError,
  notifySuccess,
} from "../Notifier/index.ts"
import { notifyAutoscoreScoreFinished } from "./autoscore.ts"
import { requestMarkerScore } from "./score-request.ts"
import { tryRestoreProfileMarkerFromCache } from "./restore-from-cache.ts"
import type { MarkerInteractionPayload, MarkerKind } from "../types.ts"
import { getScoringSettingsFromChrome } from "../../shared/get-scoring-settings-from-chrome.ts"
import {
  getCachedProfileScore,
  setCachedProfileScore,
} from "../../shared/profile-score-cache.ts"

const MARKER_SCORE_RESULT_TYPE = "markerScoreResult" as const
const MARKER_SCORE_ERROR_TYPE = "markerScoreError" as const

/** Narrows runtime messages to a successful score result from the service worker. */
function isMarkerScoreResultMessage(
  msg: unknown
): msg is {
  type: typeof MARKER_SCORE_RESULT_TYPE
  markerId: string
  kind: MarkerKind
  data: unknown
  score: number
  threshold: number
} {
  if (!msg || typeof msg !== "object") return false
  const m = msg as Record<string, unknown>
  return (
    m.type === MARKER_SCORE_RESULT_TYPE &&
    typeof m.markerId === "string" &&
    (m.kind === "profile" || m.kind === "post") &&
    typeof m.score === "number" &&
    typeof m.threshold === "number" &&
    "data" in m
  )
}

/** Narrows runtime messages to a score error from the service worker. */
function isMarkerScoreErrorMessage(
  msg: unknown
): msg is {
  type: typeof MARKER_SCORE_ERROR_TYPE
  markerId?: string
  error: string
} {
  if (!msg || typeof msg !== "object") return false
  const m = msg as Record<string, unknown>
  return (
    m.type === MARKER_SCORE_ERROR_TYPE &&
    typeof m.error === "string" &&
    (m.markerId === undefined || typeof m.markerId === "string")
  )
}

/** Reads data-kind from the marker button in the document. */
function readMarkerKindFromDom(markerId: string): MarkerKind | null {
  const el = document.getElementById(markerId)
  if (!el) return null
  const k = el.getAttribute(MARKER_KIND_ATTRIBUTE)
  if (k === "profile" || k === "post") return k
  return null
}

function profileCacheKeyFromScoreData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const url = (data as { url?: unknown }).url
  return typeof url === "string" && url.length > 0 ? url : null
}

function scoringSuccessMessage(kind: MarkerKind, data: unknown): string {
  if (!data || typeof data !== "object") {
    return kind === "profile"
      ? "Successfully scored profile."
      : "Successfully scored post."
  }
  if (kind === "profile") {
    const personName = (data as { name?: unknown }).name
    if (typeof personName === "string" && personName.trim()) {
      return `Successfully scored ${personName.trim()}.`
    }
    return "Successfully scored profile."
  }

  const publisher = (data as { publisher?: unknown }).publisher
  const personName =
    publisher &&
    typeof publisher === "object" &&
    typeof (publisher as { name?: unknown }).name === "string"
      ? ((publisher as { name?: string }).name ?? "").trim()
      : ""
  if (personName) {
    return `Successfully scored post of ${personName}.`
  }
  return "Successfully scored post."
}

/**
 * Wires marker clicks to score requests and applies service worker score/error messages to the DOM.
 *
 * @remarks Listens to chrome.runtime.onMessage; updates markers, cache, dashboard threshold hits, autoscore, and notifier.
 */
export function registerMarkerScoringBridge(): void {
  setProfileMarkerPlacedHandler(({ markerId, data }) => {
    void (async () => {
      try {
        const settings = await getScoringSettingsFromChrome()
        if (!settings.profile.useCache) return
        const key = data.url
        if (!key) return
        const score = await getCachedProfileScore(key)
        if (score === null) return
        updateMarkerState(markerId, {
          state: "score",
          score,
          threshold: settings.profile.threshold,
        })
      } catch {
        /* ignore cache hydrate failures */
      }
    })()
  })

  chrome.runtime.onMessage.addListener((message) => {
    if (isMarkerScoreResultMessage(message)) {
      console.log("[SCORE][BRIDGE] result message received", message)
      updateMarkerState(message.markerId, {
        state: "score",
        score: message.score,
        threshold: message.threshold,
      })
      if (message.kind === "profile") {
        void (async () => {
          try {
            const settings = await getScoringSettingsFromChrome()
            if (!settings.profile.useCache) return
            const key = profileCacheKeyFromScoreData(message.data)
            if (!key) return
            await setCachedProfileScore(key, message.score)
          } catch {
            /* ignore cache write failures */
          }
        })()
      }
      console.log("[SCORE][BRIDGE] marker state updated to score", {
        markerId: message.markerId,
        kind: message.kind,
        score: message.score,
        threshold: message.threshold,
      })
      notifySuccess(scoringSuccessMessage(message.kind, message.data))
      notifyAutoscoreScoreFinished(message.markerId, message.kind)
      console.log("[SCORE][BRIDGE] autoscore notified score finished", {
        markerId: message.markerId,
        kind: message.kind,
      })
      if (message.score >= message.threshold) {
        console.log("[SCORE][BRIDGE] threshold hit, appending dashboard item", {
          markerId: message.markerId,
          kind: message.kind,
          score: message.score,
          threshold: message.threshold,
          data: message.data,
        })
        void appendDashboardThresholdHit({
          kind: message.kind,
          data: message.data,
          score: message.score,
          threshold: message.threshold,
        }).catch((error) => {
          console.error("[SCORE][BRIDGE][ERROR] append threshold hit failed", {
            markerId: message.markerId,
            kind: message.kind,
            error,
          })
        })
      }
      return
    }
    if (isMarkerScoreErrorMessage(message)) {
      console.error("[SCORE][BRIDGE][ERROR] error message received", message)
      notifyError(formatScoreServiceError(message.error))
      if (message.markerId) {
        const markerId = message.markerId
        void (async () => {
          const restored = await tryRestoreProfileMarkerFromCache(markerId)
          if (!restored) {
            updateMarkerState(markerId, { state: "error" })
            console.log("[SCORE][BRIDGE] marker state set to error", {
              markerId,
            })
          } else {
            console.log("[SCORE][BRIDGE] marker restored from cache after error", {
              markerId,
            })
          }
          const kind = readMarkerKindFromDom(markerId)
          if (kind) {
            notifyAutoscoreScoreFinished(markerId, kind)
            console.log("[SCORE][BRIDGE] autoscore notified after error", {
              markerId,
              kind,
            })
          }
        })()
      }
      return
    }
  })

  setMarkerInteractionHandler((payload: MarkerInteractionPayload) => {
    console.log("[SCORE][BRIDGE] marker interaction forwarded", {
      markerId: payload.id,
      kind: payload.kind,
      payload,
    })
    requestMarkerScore(payload)
  })
}
