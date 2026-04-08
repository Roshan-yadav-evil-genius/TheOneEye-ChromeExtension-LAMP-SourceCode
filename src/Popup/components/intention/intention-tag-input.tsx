import { X } from "lucide-react"
import { useCallback, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { splitIntentionInputSegments } from "@/lib/normalize-intention-tag"

type Props = {
  /** Omit or leave empty when the parent supplies a description heading. */
  title?: string
  placeholder: string
  tags: string[]
  onAdd: (raw: string) => void
  onRemove: (tag: string) => void
}

/** Controlled tag chip list with text input to add tags (Enter/comma commit). */
export function IntentionTagInput({
  title,
  placeholder,
  tags,
  onAdd,
  onRemove,
}: Props) {
  const [draft, setDraft] = useState("")

  const commitDraft = useCallback(() => {
    const segments = splitIntentionInputSegments(draft)
    for (const segment of segments) {
      onAdd(segment)
    }
    setDraft("")
  }, [onAdd, draft])

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text/plain")
    if (!pasted || !/[,\n]/.test(pasted)) return

    e.preventDefault()
    let segments = splitIntentionInputSegments(pasted)
    const prefix = draft.trim()
    if (prefix) {
      if (segments.length === 0) {
        onAdd(prefix)
      } else {
        segments = [
          `${prefix} ${segments[0]}`.trim(),
          ...segments.slice(1),
        ]
        for (const segment of segments) {
          onAdd(segment)
        }
      }
    } else {
      for (const segment of segments) {
        onAdd(segment)
      }
    }
    setDraft("")
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      commitDraft()
      return
    }
    if (e.key === ",") {
      e.preventDefault()
      commitDraft()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {title?.trim() ? (
        <h2 className="shrink-0 text-xs font-medium text-foreground">{title}</h2>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-wrap content-start gap-1 overflow-y-auto">
        {tags.map((k) => (
          <Badge
            key={k}
            variant="secondary"
            className="gap-0.5 pr-0.5 pl-1.5 font-normal"
          >
            <button
              type="button"
              className="rounded-sm p-0.5 hover:bg-background/60"
              aria-label={`Remove ${k}`}
              onClick={() => onRemove(k)}
            >
              <X className="size-2.5" strokeWidth={2.5} />
            </button>
            <span>{k}</span>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) commitDraft()
        }}
        placeholder={placeholder}
        className="shrink-0 text-[0.65rem]"
      />
    </div>
  )
}
