import { useEffect } from "react"
import {
  AlertTriangle,
  BarChart2,
  FileText,
  Moon,
  TextCursorInput,
  User,
  Zap,
} from "lucide-react"

import { DisabledHint } from "@/components/settings/disabled-hint"
import { SettingsToggleRow } from "@/components/settings/settings-toggle-row"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { clampScoringToIntention } from "@/lib/clamp-scoring-to-intention"
import {
  hintActivitySubOptions,
  hintPostSectionSwitch,
  hintProfileSectionSwitch,
  hintWhenActivitySectionBlocked,
  hintWhenPostScoringInactive,
  hintWhenProfileScoringInactive,
} from "@/lib/settings-disabled-hints"
import {
  SCORING_THRESHOLD_MAX,
  SCORING_THRESHOLD_MIN,
} from "@/constants/scoring-threshold"
import { cn } from "@/lib/utils"
import { useIntentionStore } from "@/stores/intention-store"
import { useScoringSettingsStore } from "@/stores/scoring-settings-store"

export function SettingsPanel() {
  const profileDescription = useIntentionStore((s) => s.profileDescription)
  const postDescription = useIntentionStore((s) => s.postDescription)
  const profile = useScoringSettingsStore((s) => s.profile)
  const post = useScoringSettingsStore((s) => s.post)
  const setProfile = useScoringSettingsStore((s) => s.setProfile)
  const setPost = useScoringSettingsStore((s) => s.setPost)

  const hasProfileIntent = profileDescription.trim().length > 0
  const hasPostIntent = postDescription.trim().length > 0

  useEffect(() => {
    clampScoringToIntention()
  }, [profileDescription, postDescription, profile.about])

  const profileScoringActive = hasProfileIntent && profile.sectionEnabled
  const postScoringActive = hasPostIntent && post.sectionEnabled
  const activitySectionAllowed =
    profileScoringActive && profile.about && hasPostIntent
  const activityEnabled = activitySectionAllowed && profile.activity

  const profileInnerHint = hintWhenProfileScoringInactive(
    hasProfileIntent,
    profile.sectionEnabled
  )
  const postInnerHint = hintWhenPostScoringInactive(
    hasPostIntent,
    post.sectionEnabled
  )
  const activityToggleHint = hintWhenActivitySectionBlocked(
    hasProfileIntent,
    profile.sectionEnabled,
    profile.about,
    hasPostIntent
  )
  const activityCheckboxHint = hintActivitySubOptions(
    activityEnabled,
    hasProfileIntent,
    profile.sectionEnabled,
    profile.about,
    hasPostIntent,
    profile.activity
  )

  return (
    <div className="grid min-h-0 grid-cols-1 gap-2 sm:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader className="flex-row items-center gap-2 space-y-0 pb-0">
          <User
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <CardTitle className="flex-1">Profile scoring</CardTitle>
          <DisabledHint
            disabled={!hasProfileIntent}
            hint={hintProfileSectionSwitch(hasProfileIntent)}
            wrapperClassName="shrink-0"
          >
            <Switch
              checked={profile.sectionEnabled}
              onCheckedChange={(v) => setProfile({ sectionEnabled: v })}
              disabled={!hasProfileIntent}
            />
          </DisabledHint>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[0.65rem] text-muted-foreground">
                Threshold
              </Label>
              <span className="text-[0.65rem] tabular-nums text-foreground">
                {profile.threshold}
              </span>
            </div>
            <DisabledHint
              disabled={!profileScoringActive}
              hint={profileInnerHint}
              wrapperClassName="block w-full"
            >
              <Slider
                min={SCORING_THRESHOLD_MIN}
                max={SCORING_THRESHOLD_MAX}
                step={1}
                value={[profile.threshold]}
                onValueChange={([v]) => setProfile({ threshold: v })}
                disabled={!profileScoringActive}
              />
            </DisabledHint>
          </div>
          <div className="flex flex-col gap-0.5 border-t border-border pt-1">
            <SettingsToggleRow
              icon={Zap}
              label="Autoscore"
              checked={profile.autoscore}
              onCheckedChange={(v) => setProfile({ autoscore: v })}
              disabled={!profileScoringActive}
              disabledHint={profileInnerHint}
            />
            <SettingsToggleRow
              icon={TextCursorInput}
              label="Headline"
              checked={profile.headline}
              onCheckedChange={(v) => setProfile({ headline: v })}
              disabled={!profileScoringActive}
              disabledHint={profileInnerHint}
            />
            <SettingsToggleRow
              icon={FileText}
              label="About"
              checked={profile.about}
              onCheckedChange={(v) => setProfile({ about: v })}
              disabled={!profileScoringActive}
              disabledHint={profileInnerHint}
            />
            <SettingsToggleRow
              icon={BarChart2}
              label="Activity"
              checked={profile.activity}
              onCheckedChange={(v) => setProfile({ activity: v })}
              disabled={!activitySectionAllowed}
              disabledHint={activityToggleHint}
            />
          </div>
          <div
            className={cn(
              "flex flex-wrap gap-3 border-t border-border pt-2",
              !activityEnabled && "opacity-50"
            )}
          >
            {(
              [
                ["activityPublished", "Published"],
                ["activityReacted", "Reacted"],
                ["activityCommented", "Commented"],
              ] as const
            ).map(([key, text]) => (
              <label
                key={key}
                className={cn(
                  "flex items-center gap-1.5",
                  activityEnabled ? "cursor-pointer" : "cursor-default"
                )}
              >
                <DisabledHint
                  disabled={!activityEnabled}
                  hint={activityCheckboxHint}
                  wrapperClassName="shrink-0"
                >
                  <Checkbox
                    checked={profile[key]}
                    onCheckedChange={(v) =>
                      setProfile({ [key]: v === true } as Record<
                        string,
                        boolean
                      >)
                    }
                    disabled={!activityEnabled}
                  />
                </DisabledHint>
                <span className="text-[0.65rem] text-foreground">{text}</span>
              </label>
            ))}
          </div>
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1.5">
            <div className="flex gap-1.5">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-destructive"
                aria-hidden
              />
              <p className="text-[0.6rem] leading-snug text-destructive">
                Heavy use of activity scoring can lead to LinkedIn account
                restrictions.
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-1">
            <SettingsToggleRow
              icon={Moon}
              label="Use cache"
              checked={profile.useCache}
              onCheckedChange={(v) => setProfile({ useCache: v })}
              disabled={!profileScoringActive}
              disabledHint={profileInnerHint}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="flex-row items-center gap-2 space-y-0 pb-0">
          <FileText
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <CardTitle className="flex-1">Post scoring</CardTitle>
          <DisabledHint
            disabled={!hasPostIntent}
            hint={hintPostSectionSwitch(hasPostIntent)}
            wrapperClassName="shrink-0"
          >
            <Switch
              checked={post.sectionEnabled}
              onCheckedChange={(v) => setPost({ sectionEnabled: v })}
              disabled={!hasPostIntent}
            />
          </DisabledHint>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[0.65rem] text-muted-foreground">
                Threshold
              </Label>
              <span className="text-[0.65rem] tabular-nums text-foreground">
                {post.threshold}
              </span>
            </div>
            <DisabledHint
              disabled={!postScoringActive}
              hint={postInnerHint}
              wrapperClassName="block w-full"
            >
              <Slider
                min={SCORING_THRESHOLD_MIN}
                max={SCORING_THRESHOLD_MAX}
                step={1}
                value={[post.threshold]}
                onValueChange={([v]) => setPost({ threshold: v })}
                disabled={!postScoringActive}
              />
            </DisabledHint>
          </div>
          <div className="flex flex-col gap-0.5 border-t border-border pt-1">
            <SettingsToggleRow
              icon={Zap}
              label="Autoscore"
              checked={post.autoscore}
              onCheckedChange={(v) => setPost({ autoscore: v })}
              disabled={!postScoringActive}
              disabledHint={postInnerHint}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
