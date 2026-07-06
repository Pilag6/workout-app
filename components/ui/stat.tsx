import * as React from "react"
import { cn } from "@/lib/utils"

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  unit?: string
  hint?: string
  icon?: React.ReactNode
  accent?: boolean
}

/**
 * A restrained metric block. Used across the dashboard, progress and
 * summary screens so every number reads with the same hierarchy.
 */
const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ label, value, unit, hint, icon, accent = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-soft",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {icon ? (
          <span className={cn("text-muted-foreground", accent && "text-brand")}>{icon}</span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-display text-3xl font-semibold tabular-nums tracking-tight",
            accent && "text-brand"
          )}
        >
          {value}
        </span>
        {unit ? <span className="text-sm font-medium text-muted-foreground">{unit}</span> : null}
      </div>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
)
Stat.displayName = "Stat"

export { Stat }
