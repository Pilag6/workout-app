import type React from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  /** 0 - 100 */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
  trackClassName?: string
  indicatorClassName?: string
}

/** Minimal circular progress indicator built with SVG (no dependencies). */
export const ProgressRing = ({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  children,
  trackClassName,
  indicatorClassName,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-secondary", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("stroke-brand transition-[stroke-dashoffset] duration-700 ease-out-expo", indicatorClassName)}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
      ) : null}
    </div>
  )
}
