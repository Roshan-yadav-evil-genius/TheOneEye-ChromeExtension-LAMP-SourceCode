export async function copyTextToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("clipboard_unavailable")
  }
  await navigator.clipboard.writeText(text)
}
