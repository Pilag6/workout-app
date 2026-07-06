import type React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  /** Wider layout for build/library screens that use split columns. */
  size?: "default" | "wide"
}

/** Standard page padding and max width, tuned for the app shell offset. */
export const PageContainer = ({ children, className, size = "default" }: PageContainerProps) => {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        size === "wide" ? "max-w-[1400px]" : "max-w-5xl",
        className
      )}
    >
      {children}
    </div>
  )
}
