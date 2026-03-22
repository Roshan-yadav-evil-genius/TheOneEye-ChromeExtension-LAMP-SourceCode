import { useState } from "react"

import { Button } from "@/components/ui/button"
import { copyQualifiedProfilesCsvToClipboard } from "@/lib/qualified-profiles-csv"
import type { Profile } from "../../../Content/types.ts"

type Props = {
  hint: string
  profiles: Profile[]
  copyDisabled: boolean
}

export function QualifiedDashboardToolbar({
  hint,
  profiles,
  copyDisabled,
}: Props) {
  const [label, setLabel] = useState<"Copy" | "Copied" | "Failed">("Copy")

  async function handleCopy() {
    if (copyDisabled || profiles.length === 0) return
    try {
      await copyQualifiedProfilesCsvToClipboard(profiles)
      setLabel("Copied")
      window.setTimeout(() => setLabel("Copy"), 2000)
    } catch {
      setLabel("Failed")
      window.setTimeout(() => setLabel("Copy"), 2000)
    }
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      <p className="min-w-0 flex-1 text-[0.65rem] leading-snug text-muted-foreground">
        {hint}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-7 shrink-0 px-2 text-[0.65rem]"
        disabled={copyDisabled || profiles.length === 0}
        onClick={() => void handleCopy()}
      >
        {label}
      </Button>
    </div>
  )
}
