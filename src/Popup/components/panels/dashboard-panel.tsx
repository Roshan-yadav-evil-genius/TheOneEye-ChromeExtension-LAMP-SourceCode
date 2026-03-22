import {
  Database,
  FileCheck,
  FileText,
  User,
  UserCheck,
} from "lucide-react"

import { DashboardHitRow } from "@/components/dashboard/dashboard-hit-row"
import { QualifiedDashboardToolbar } from "@/components/dashboard/qualified-dashboard-toolbar"
import { StatRow } from "@/components/dashboard/stat-row"
import { Button } from "@/components/ui/button"
import { useDashboardLists } from "@/lib/use-dashboard-lists"
import { usePopupNavStore } from "@/stores/popup-nav-store"
import { useStatsStore } from "@/stores/stats-store"

const EMPTY_COPY: Record<
  "posts" | "profiles" | "qualified",
  { title: string; hint: string }
> = {
  posts: {
    title: "Posts",
    hint: "Profiles whose posts scored above threshold — mark as qualified or dismiss.",
  },
  profiles: {
    title: "Profiles",
    hint: "Profiles scored against your intention — review and qualify.",
  },
  qualified: {
    title: "Qualified",
    hint: "Profiles you marked as qualified appear here.",
  },
}

export function DashboardPanel() {
  const view = usePopupNavStore((s) => s.dashboardView)
  const {
    postHits,
    profileHits,
    qualified,
    loading,
    dropPost,
    dropProfile,
    dropQualifiedRow,
    qualifyPost,
    qualifyProfile,
  } = useDashboardLists()
  const profilesScored = useStatsStore((s) => s.profilesScored)
  const relevantProfiles = useStatsStore((s) => s.relevantProfiles)
  const postsScored = useStatsStore((s) => s.postsScored)
  const relevantPosts = useStatsStore((s) => s.relevantPosts)
  const profilesInCache = useStatsStore((s) => s.profilesInCache)
  const reset = useStatsStore((s) => s.reset)

  if (view === "stats") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <StatRow icon={User} label="Profiles scored" value={profilesScored} />
          <StatRow
            icon={UserCheck}
            label="Relevant profiles"
            value={relevantProfiles}
          />
          <StatRow icon={FileText} label="Posts scored" value={postsScored} />
          <StatRow
            icon={FileCheck}
            label="Relevant posts"
            value={relevantPosts}
          />
          <StatRow
            icon={Database}
            label="Profiles in cache"
            value={profilesInCache}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-1 w-full"
          size="sm"
          onClick={() => reset()}
        >
          Reset
        </Button>
      </div>
    )
  }

  const { title, hint } = EMPTY_COPY[view]
  const isEmpty =
    view === "posts"
      ? postHits.length === 0
      : view === "profiles"
        ? profileHits.length === 0
        : qualified.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {view === "qualified" ? (
        <QualifiedDashboardToolbar
          hint={hint}
          profiles={qualified.map((q) => q.profile)}
          copyDisabled={loading}
        />
      ) : (
        <p className="shrink-0 text-[0.65rem] leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
      {loading ? (
        <p className="shrink-0 text-xs text-muted-foreground">Loading…</p>
      ) : isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border py-8">
          <p className="text-xs font-medium text-muted-foreground">None yet</p>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground/80">
            {title}
          </p>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-0.5">
          {view === "posts"
            ? postHits.map((h) => (
                <li key={h.id}>
                  <DashboardHitRow
                    profile={h.post.publisher}
                    onDrop={() => dropPost(h.id)}
                    onQualify={() => qualifyPost(h.id)}
                  />
                </li>
              ))
            : null}
          {view === "profiles"
            ? profileHits.map((h) => (
                <li key={h.id}>
                  <DashboardHitRow
                    profile={h.profile}
                    onDrop={() => dropProfile(h.id)}
                    onQualify={() => qualifyProfile(h.id)}
                  />
                </li>
              ))
            : null}
          {view === "qualified"
            ? qualified.map((q) => (
                <li key={q.id}>
                  <DashboardHitRow
                    profile={q.profile}
                    onDrop={() => dropQualifiedRow(q.id)}
                    showQualify={false}
                  />
                </li>
              ))
            : null}
        </ul>
      )}
    </div>
  )
}
