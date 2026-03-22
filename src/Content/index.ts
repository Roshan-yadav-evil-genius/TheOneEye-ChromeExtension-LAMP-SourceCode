/**
 * Runs in page contexts matched by manifest `content_scripts`.
 * Keep this entry self-contained to avoid extra chunk files in the extension package.
 */
function init(): void {
  // Example: observe or augment the DOM; wire messaging to the service worker as needed.
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true })
} else {
  init()
}
