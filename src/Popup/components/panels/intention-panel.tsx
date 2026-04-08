import { Info } from "lucide-react"

import { IntentionTagInput } from "@/components/intention/intention-tag-input"
import { KeywordTagInput } from "@/components/intention/keyword-tag-input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { usePopupNavStore } from "@/stores/popup-nav-store"
import { useIntentionStore } from "@/stores/intention-store"

/** Edits intention text and tag lists persisted to chrome.storage. */
export function IntentionPanel() {
  const view = usePopupNavStore((s) => s.intentionView)
  const profileDescription = useIntentionStore((s) => s.profileDescription)
  const postDescription = useIntentionStore((s) => s.postDescription)
  const headlineTags = useIntentionStore((s) => s.headlineTags)
  const addHeadlineTag = useIntentionStore((s) => s.addHeadlineTag)
  const removeHeadlineTag = useIntentionStore((s) => s.removeHeadlineTag)
  const setProfileDescription = useIntentionStore(
    (s) => s.setProfileDescription
  )
  const setPostDescription = useIntentionStore((s) => s.setPostDescription)

  if (view === "keywords") {
    return <KeywordTagInput />
  }

  if (view === "headline") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex shrink-0 items-start justify-between gap-2">
          <Label className="block flex-1 text-[0.65rem] font-normal leading-snug text-muted-foreground">
            Describe what kind of headline you are looking for
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="About this field"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[14rem]">
              Add short cues that match LinkedIn headline styles you care about
              (roles, signals, phrases). Used when Headline scoring is enabled in
              Settings.
            </TooltipContent>
          </Tooltip>
        </div>
        <IntentionTagInput
          placeholder="Headline cue — Enter, comma, or paste a comma/newline-separated list"
          tags={headlineTags}
          onAdd={addHeadlineTag}
          onRemove={removeHeadlineTag}
        />
      </div>
    )
  }

  const isProfile = view === "profile"
  const label = isProfile
    ? "Describe what kind of profile you are looking for"
    : "Describe what kind of post you are looking for"
  const value = isProfile ? profileDescription : postDescription
  const onChange = isProfile ? setProfileDescription : setPostDescription
  const tooltip = isProfile
    ? "Used to score LinkedIn profiles against your ideal customer or hire."
    : "Used to score individual posts for relevance to your offer or research."

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <Label className="block flex-1 text-[0.65rem] font-normal leading-snug text-muted-foreground">
          {label}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="About this field"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[14rem]">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-0 flex-1 resize-none field-sizing-fixed text-[0.65rem] leading-relaxed"
        spellCheck
      />
    </div>
  )
}
