import {
  CircleAlert,
  LayoutGrid,
  Settings,
  Target,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  type PrimaryTab,
  usePopupNavStore,
} from "@/stores/popup-nav-store"

import TheOneEyeLogo from "@/assets/TheOneEye.png"

const TABS: { id: PrimaryTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "intention", label: "Intention", icon: Target },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "report", label: "Report", icon: CircleAlert },
]

/** Primary tab bar and branding for the extension popup. */
export function PopupTopNav() {
  const primary = usePopupNavStore((s) => s.primary)
  const setPrimary = usePopupNavStore((s) => s.setPrimary)

  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-border px-2 py-1.5">
      <div className="flex min-w-0 items-center gap-1.5 pr-1">
        <img src={TheOneEyeLogo} alt="TheOneEye" width={42}/>
        <span className="truncate text-xs font-semibold tracking-tight">
          TheOneEye(v0.1.0)
        </span>
      </div>
      <nav
        className="flex min-w-0 flex-1 items-stretch justify-end"
        aria-label="Primary"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = primary === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPrimary(id)}
              className={cn(
                "flex min-w-0 flex-1 max-w-30 flex-row items-center justify-center gap-1 rounded-md px-1 py-1 text-[0.65rem] font-medium transition-colors",
                active
                  ? "border-b-2 border-primary text-foreground"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          )
        })}
      </nav>
    </header>
  )
}
