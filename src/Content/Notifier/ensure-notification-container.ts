import {
  NOTIFICATION_CONTAINER_ELEMENT_ID,
  NOTIFICATION_RIGHT_OFFSET_PX,
  NOTIFICATION_TOP_OFFSET_PX,
  NOTIFICATION_Z_INDEX,
} from "./notifier-constants.ts"

/** Creates the fixed-position flex column host for stacked toasts. */
function createNotificationContainer(): HTMLDivElement {
  const el = document.createElement("div")
  el.id = NOTIFICATION_CONTAINER_ELEMENT_ID
  el.setAttribute("data-the-one-eye", "notification-host")
  Object.assign(el.style, {
    position: "fixed",
    top: `${NOTIFICATION_TOP_OFFSET_PX}px`,
    right: `${NOTIFICATION_RIGHT_OFFSET_PX}px`,
    zIndex: String(NOTIFICATION_Z_INDEX),
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "8px",
    pointerEvents: "none",
    width: "300px",
    maxWidth: "300px",
    boxSizing: "border-box",
  } satisfies Partial<CSSStyleDeclaration> as CSSStyleDeclaration)
  return el
}

/**
 * Returns the stack host, creating and appending it when missing or detached.
 */
export function ensureNotificationContainer(): HTMLElement {
  const el = document.getElementById(NOTIFICATION_CONTAINER_ELEMENT_ID)
  if (el instanceof HTMLElement && el.isConnected) {
    return el
  }
  const next = createNotificationContainer()
  document.body.appendChild(next)
  return next
}
