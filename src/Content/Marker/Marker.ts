import { THE_ONE_EYE_MARKER_CLASS } from "../constants.ts"

export interface TheOneEyeOptions {
  float?: boolean
}

function createEyeContainer(
  profile: HTMLElement,
  { float = true }: TheOneEyeOptions = {}
): HTMLButtonElement | null {
  if (float) {
    profile.style.position = "relative"
  }
  if (profile.querySelector(`.${THE_ONE_EYE_MARKER_CLASS}`)) return null

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
  profile.insertBefore(eyeRoot, profile.firstChild)
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

function spinnerUi(container: HTMLElement): void {
  container.innerHTML = ""

  const spinner = document.createElement("div")
  spinner.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid rgba(224, 183, 65, 0.35);
        border-top-color: #e0b741;
        box-sizing: border-box;
    `
  spinner.animate(
    [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    { duration: 700, iterations: Number.POSITIVE_INFINITY, easing: "linear" }
  )
  container.appendChild(spinner)
}

function scoreUi(container: HTMLElement): void {
  container.innerHTML = ""

  const score = Math.floor(Math.random() * 100) + 1
  const isGreen = Math.random() < 0.5
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

function attachEyeBehavior(container: HTMLElement): void {
  let busy = false
  container.addEventListener("click", () => {
    if (busy) return
    busy = true
    spinnerUi(container)
    setTimeout(() => {
      scoreUi(container)
      busy = false
    }, 650)
  })
}

/** Injects the TheOneEye marker UI on a profile or post host element. */
export function placeScoringButton(
  profile: HTMLElement | null,
  options: TheOneEyeOptions = {}
): void {
  if (!profile) return
  const eyeContainer = createEyeContainer(profile, options)
  if (!eyeContainer) return
  deformEyeUi(eyeContainer)
  attachEyeBehavior(eyeContainer)
}
