import { THE_ONE_EYE_MARKER_CLASS } from "./constants.ts"
import { clearAutoscoreBusyIfMatches } from "./autoscore-busy.ts"
import type {
  MarkerDomState,
  MarkerInteractionPayload,
  MarkerKind,
  MarkerVisualUpdate,
  Post,
  Profile,
} from "../types.ts"

/**
 * In-page scoring marker UI: create/remove buttons, keep payloads, drive default/loading/score/error visuals.
 *
 * @remarks Mutates the DOM; coordinates with autoscore via disabled state when a kind is auto-scoring.
 */

/** Layout options for a marker host (floating overlay vs inline). */
export interface TheOneEyeOptions {
  float?: boolean
}

/** Discriminated options for placing either a profile or post marker. */
export type PlaceScoringButtonOptions =
  | (TheOneEyeOptions & { kind: "profile"; data: Profile })
  | (TheOneEyeOptions & { kind: "post"; data: Post })

/** Default threshold for score state: at or above = green, below = red. */
export const DEFAULT_SCORE_THRESHOLD = 50

/**
 * Set on each marker button to `profile` or `post`. Example:
 * `document.querySelectorAll('button.TheOneEyeMarker[data-kind="post"]')`.
 */
export const MARKER_KIND_ATTRIBUTE = "data-kind" as const

/**
 * Mirrors visual state for DOM queries. Values: default | loading | score | error.
 */
export const MARKER_STATE_ATTRIBUTE = "data-marker-state" as const

/** Saved inline `position` on float hosts before `position: relative` is applied. */
const HOST_FLOAT_POSITION_ATTR = "data-oe-marker-float-position-prev" as const

const markerPayloads = new WeakMap<
  HTMLButtonElement,
  MarkerInteractionPayload
>()
const markerSpinnerAnimations = new WeakMap<HTMLButtonElement, Animation>()

let autoscoreProfileActive = false
let autoscorePostActive = false

let interactionHandler: ((payload: MarkerInteractionPayload) => void) | null =
  null

export type ProfileMarkerPlacedPayload = {
  markerId: string
  data: Profile
}

let profileMarkerPlacedHandler: ((
  payload: ProfileMarkerPlacedPayload
) => void) | null = null

/** Registers a callback invoked when a profile marker is placed (cache hydration). */
export function setProfileMarkerPlacedHandler(
  handler: ((payload: ProfileMarkerPlacedPayload) => void) | null
): void {
  profileMarkerPlacedHandler = handler
}

function defaultInteractionHandler(payload: MarkerInteractionPayload): void {
  console.warn("[SCORE][CLICK] no interaction handler registered", {
    markerId: payload.id,
    kind: payload.kind,
    payload,
  })
}

/** Registers the handler for marker button clicks (e.g. scoring bridge). */
export function setMarkerInteractionHandler(
  handler: ((payload: MarkerInteractionPayload) => void) | null
): void {
  interactionHandler = handler
}

function resolveInteractionHandler(): (payload: MarkerInteractionPayload) => void {
  return interactionHandler ?? defaultInteractionHandler
}

function setMarkerButtonDomState(
  button: HTMLButtonElement,
  state: MarkerDomState
): void {
  button.setAttribute(MARKER_STATE_ATTRIBUTE, state)
}

function applyAutoscoreDisabledToButton(button: HTMLButtonElement): void {
  const kind = button.getAttribute(MARKER_KIND_ATTRIBUTE) as MarkerKind | null
  if (kind === "profile") {
    button.disabled = autoscoreProfileActive
  } else if (kind === "post") {
    button.disabled = autoscorePostActive
  }
}

function refreshAllMarkerAutoscoreDisabled(): void {
  for (const node of document.querySelectorAll(
    `button.${THE_ONE_EYE_MARKER_CLASS}`
  )) {
    if (node instanceof HTMLButtonElement) {
      applyAutoscoreDisabledToButton(node)
    }
  }
}

/**
 * When autoscore is on for a kind, markers of that kind become non-interactive.
 */
export function setMarkerAutoscoreFlags(flags: {
  profile: boolean
  post: boolean
}): void {
  autoscoreProfileActive = flags.profile
  autoscorePostActive = flags.post
  refreshAllMarkerAutoscoreDisabled()
}

export function getMarkerAutoscoreFlags(): {
  profile: boolean
  post: boolean
} {
  return {
    profile: autoscoreProfileActive,
    post: autoscorePostActive,
  }
}

/** Looks up the interaction payload stored for a marker button by DOM id. */
export function getMarkerPayloadForId(
  id: string
): MarkerInteractionPayload | null {
  const el = document.getElementById(id)
  if (!el || !isMarkerButton(el)) return null
  return markerPayloads.get(el) ?? null
}

function cancelSpinner(button: HTMLButtonElement): void {
  const anim = markerSpinnerAnimations.get(button)
  if (anim) {
    anim.cancel()
    markerSpinnerAnimations.delete(button)
  }
}

/**
 * Stops the event from reaching a wrapping `<a>` (or other parents) so clicks score instead of navigating.
 */
function blockMarkerEventFromActivatingParentLink(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
}

function createEyeContainer(
  host: HTMLElement,
  { float = true }: TheOneEyeOptions = {}
): HTMLButtonElement | null {
  if (float) {
    if (!host.hasAttribute(HOST_FLOAT_POSITION_ATTR)) {
      host.setAttribute(HOST_FLOAT_POSITION_ATTR, host.style.position)
    }
    host.style.position = "relative"
  }
  if (host.querySelector(`.${THE_ONE_EYE_MARKER_CLASS}`)) return null

  const eyeRoot = document.createElement("button")
  eyeRoot.type = "button"
  eyeRoot.className = THE_ONE_EYE_MARKER_CLASS
  eyeRoot.style.cssText = float
    ? `
        width: 22px;
        height: 22px;
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 50%;
        border: none;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        z-index: 2;
        cursor: pointer;
        background: transparent;
    `
    : `
        width: 22px;
        height: 22px;
        position: static;
        display: inline-block;
        vertical-align: middle;
        flex-shrink: 0;
        border-radius: 50%;
        border: none;
        padding: 0;
        margin: 0 6px 0 0;
        box-sizing: border-box;
        cursor: pointer;
        background: transparent;
    `
  host.insertBefore(eyeRoot, host.firstChild)
  return eyeRoot
}

function deformEyeUi(container: HTMLElement): void {
  container.innerHTML = ""

  const eyeOuter = document.createElement("div")
  eyeOuter.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid #e0b741;
        background: linear-gradient(
            180deg,
            #7d7d82 0%,
            #b9bcc2 26%,
            #d4d6dd 50%,
            #b7bac0 74%,
            #64666c 100%
        );
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
    `

  const eyePupil = document.createElement("div")
  eyePupil.style.cssText = `
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #050a23;
        position: relative;
    `

  const eyeHighlight = document.createElement("div")
  eyeHighlight.style.cssText = `
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #f3f4f6;
        position: absolute;
        top: 1px;
        right: 1px;
    `

  eyePupil.appendChild(eyeHighlight)
  eyeOuter.appendChild(eyePupil)
  container.appendChild(eyeOuter)
}

function spinnerUi(button: HTMLButtonElement): Animation {
  button.innerHTML = ""

  const spinner = document.createElement("div")
  spinner.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid rgba(224, 183, 65, 0.35);
        border-top-color: #e0b741;
        box-sizing: border-box;
    `
  button.appendChild(spinner)
  return spinner.animate(
    [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    { duration: 700, iterations: Number.POSITIVE_INFINITY, easing: "linear" }
  )
}

function scoreUi(
  container: HTMLElement,
  score: number,
  threshold: number
): void {
  container.innerHTML = ""

  const isGreen = score >= threshold
  const bgColor = isGreen ? "#1f9d4c" : "#d32f2f"

  const badge = document.createElement("div")
  badge.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid #e0b741;
        box-sizing: border-box;
        background: ${bgColor};
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
    `
  badge.textContent = String(score)
  container.appendChild(badge)
}

/** Scoring failed: solid red disc, no score number (autoscore skips this state). */
function errorUi(container: HTMLElement): void {
  container.innerHTML = ""

  const disc = document.createElement("div")
  disc.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid #e0b741;
        box-sizing: border-box;
        background: #b91c1c;
        display: flex;
        align-items: center;
        justify-content: center;
    `
  container.appendChild(disc)
}

function isMarkerButton(el: Element): el is HTMLButtonElement {
  return (
    el instanceof HTMLButtonElement &&
    el.classList.contains(THE_ONE_EYE_MARKER_CLASS)
  )
}

/**
 * Applies a visual update to the marker button with the given id.
 *
 * @remarks DOM update; cancels any in-flight spinner animation before switching state.
 */
export function updateMarkerState(id: string, update: MarkerVisualUpdate): void {
  const el = document.getElementById(id)
  if (!el || !isMarkerButton(el)) return

  cancelSpinner(el)

  switch (update.state) {
    case "default":
      deformEyeUi(el)
      setMarkerButtonDomState(el, "default")
      break
    case "loading": {
      const anim = spinnerUi(el)
      markerSpinnerAnimations.set(el, anim)
      setMarkerButtonDomState(el, "loading")
      break
    }
    case "score": {
      const threshold = update.threshold ?? DEFAULT_SCORE_THRESHOLD
      scoreUi(el, update.score, threshold)
      setMarkerButtonDomState(el, "score")
      break
    }
    case "error":
      errorUi(el)
      setMarkerButtonDomState(el, "error")
      break
  }
}

/**
 * Injects a scoring marker on `host`. Returns the marker id, or null if skipped.
 */
export function placeScoringButton(
  host: HTMLElement | null,
  options: PlaceScoringButtonOptions
): string | null {
  if (!host) return null

  const { kind, data, ...layoutOpts } = options
  const eyeContainer = createEyeContainer(host, layoutOpts)
  if (!eyeContainer) return null

  const id = crypto.randomUUID()
  eyeContainer.id = id
  eyeContainer.setAttribute(MARKER_KIND_ATTRIBUTE, kind)
  setMarkerButtonDomState(eyeContainer, "default")

  const payload: MarkerInteractionPayload =
    kind === "profile"
      ? { id, kind: "profile", data }
      : { id, kind: "post", data }

  markerPayloads.set(eyeContainer, payload)
  deformEyeUi(eyeContainer)
  applyAutoscoreDisabledToButton(eyeContainer)

  eyeContainer.addEventListener("pointerdown", blockMarkerEventFromActivatingParentLink, {
    capture: true,
  })
  eyeContainer.addEventListener("mousedown", blockMarkerEventFromActivatingParentLink, {
    capture: true,
  })

  eyeContainer.addEventListener("click", (event: MouseEvent) => {
    blockMarkerEventFromActivatingParentLink(event)
    const markerState = eyeContainer.getAttribute(MARKER_STATE_ATTRIBUTE)
    console.log("[SCORE][CLICK] marker clicked", {
      markerId: id,
      kind,
      disabled: eyeContainer.disabled,
      markerState,
    })
    if (eyeContainer.disabled) {
      console.warn("[SCORE][CLICK] click ignored because disabled", {
        markerId: id,
        kind,
      })
      return
    }
    const p = markerPayloads.get(eyeContainer)
    if (p) {
      console.log("[SCORE][CLICK] dispatch interaction payload", {
        markerId: p.id,
        kind: p.kind,
        payload: p,
      })
      resolveInteractionHandler()(p)
      return
    }
    console.warn("[SCORE][CLICK] missing marker payload", { markerId: id, kind })
  })

  if (kind === "profile") {
    queueMicrotask(() => {
      profileMarkerPlacedHandler?.({ markerId: id, data })
    })
  }

  return id
}

export type RemoveScoringButtonOptions = TheOneEyeOptions & {
  kind?: MarkerKind
}

/**
 * Removes a marker inside `host` if present. Restores float host `position` when applicable.
 * Clears autoscore busy state for the removed marker id.
 */
export function removeScoringButton(
  host: HTMLElement | null,
  options?: RemoveScoringButtonOptions
): string | null {
  if (!host) return null

  const float = options?.float !== false
  const kindFilter = options?.kind

  const btn = host.querySelector(`button.${THE_ONE_EYE_MARKER_CLASS}`)
  if (!(btn instanceof HTMLButtonElement)) return null

  const domKind = btn.getAttribute(MARKER_KIND_ATTRIBUTE) as MarkerKind | null
  if (kindFilter && domKind !== kindFilter) return null

  cancelSpinner(btn)
  markerPayloads.delete(btn)
  const id = btn.id
  btn.remove()

  if (float && host.hasAttribute(HOST_FLOAT_POSITION_ATTR)) {
    const prev = host.getAttribute(HOST_FLOAT_POSITION_ATTR) ?? ""
    host.style.position = prev
    host.removeAttribute(HOST_FLOAT_POSITION_ATTR)
  }

  if (domKind === "profile" || domKind === "post") {
    clearAutoscoreBusyIfMatches(id, domKind)
  }

  return id || null
}
