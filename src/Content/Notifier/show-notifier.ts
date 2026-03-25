import { ensureNotificationContainer } from "./ensure-notification-container.ts"
import {
  NOTIFICATION_DURATION_MS,
  NOTIFICATION_TOAST_CLASS,
} from "./notifier-constants.ts"
import type { NotifierType } from "./notifier-types.ts"

const VARIANT_STYLE: Record<
  NotifierType,
  { backgroundColor: string; borderLeft: string; color: string }
> = {
  error: {
    backgroundColor: "rgba(49, 28, 32, 0.96)",
    borderLeft: "4px solid #f87171",
    color: "#fef2f2",
  },
  success: {
    backgroundColor: "rgba(22, 42, 35, 0.96)",
    borderLeft: "4px solid #34d399",
    color: "#ecfdf5",
  },
  warning: {
    backgroundColor: "rgba(48, 38, 20, 0.96)",
    borderLeft: "4px solid #fbbf24",
    color: "#fffbeb",
  },
  info: {
    backgroundColor: "rgba(22, 36, 52, 0.96)",
    borderLeft: "4px solid #38bdf8",
    color: "#f0f9ff",
  },
}

/** Applies toast class names and inline styles for a notifier variant. */
function styleToast(el: HTMLDivElement, type: NotifierType): void {
  const v = VARIANT_STYLE[type]
  el.className = `${NOTIFICATION_TOAST_CLASS} ${NOTIFICATION_TOAST_CLASS}--${type}`
  el.dataset.notifierType = type
  Object.assign(el.style, {
    pointerEvents: "auto",
    padding: "10px 14px",
    borderRadius: "8px",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: "13px",
    lineHeight: "1.35",
    color: v.color,
    backgroundColor: v.backgroundColor,
    borderLeft: v.borderLeft,
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    width: "100%",
    maxWidth: "100%",
    minWidth: "0",
    minHeight: "0",
    whiteSpace: "normal",
    overflow: "visible",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    textOverflow: "clip",
    opacity: "1",
    transition: "opacity 180ms ease-out",
    boxSizing: "border-box",
  } satisfies Partial<CSSStyleDeclaration> as CSSStyleDeclaration)
}

/**
 * Shows a toast in the top-right stack; each call gets its own ~2s lifetime.
 * @param type — Visual variant: info, error, success, or warning (default `error`).
 */
export function showNotifier(
  message: string,
  type: NotifierType = "error"
): void {
  const text = message.trim()
  if (!text) return

  const host = ensureNotificationContainer()
  const toast = document.createElement("div")
  styleToast(toast, type)
  toast.textContent = text
  host.appendChild(toast)

  const removeSoon = (): void => {
    toast.style.opacity = "0"
    window.setTimeout(() => {
      toast.remove()
    }, 200)
  }

  window.setTimeout(removeSoon, NOTIFICATION_DURATION_MS)
}

/** Shows an info-styled toast. */
export function notifyInfo(message: string): void {
  showNotifier(message, "info")
}

/** Shows an error-styled toast. */
export function notifyError(message: string): void {
  showNotifier(message, "error")
}

/** Shows a success-styled toast. */
export function notifySuccess(message: string): void {
  showNotifier(message, "success")
}

/** Shows a warning-styled toast. */
export function notifyWarning(message: string): void {
  showNotifier(message, "warning")
}
