"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, Home, TrendingUp, LibraryBig, User, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { href: "/workout", label: "Train", icon: Dumbbell, match: (p) => p.startsWith("/workout") },
  { href: "/routines", label: "Routines", icon: ClipboardList, match: (p) => p.startsWith("/routines") },
  { href: "/progress", label: "Progress", icon: TrendingUp, match: (p) => p.startsWith("/progress") },
  { href: "/exercises", label: "Library", icon: LibraryBig, match: (p) => p.startsWith("/exercises") },
  { href: "/settings", label: "Profile", icon: User, match: (p) => p.startsWith("/settings") },
]

const Logo = ({ compact = false }: { compact?: boolean }) => (
  <Link href="/" className="flex items-center gap-2.5" aria-label="Home Workout Pro">
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-brand">
      <Dumbbell className="h-5 w-5" />
    </span>
    {!compact ? (
      <span className="flex flex-col leading-none">
        <span className="font-display text-sm font-semibold tracking-tight">Home Workout</span>
        <span className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Pro
        </span>
      </span>
    ) : null}
  </Link>
)

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() || "/"

  // The active workout is a distraction-free, full-screen focus mode.
  const focusMode = pathname === "/routine" || pathname.startsWith("/routine/")

  if (focusMode) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      {/* Desktop side rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card/60 px-4 py-6 backdrop-blur lg:flex">
        <div className="mb-8 px-2">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-[1.15rem] w-[1.15rem] transition-colors",
                    active ? "text-brand" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between rounded-lg px-2">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
        <Logo compact />
        <ThemeToggle />
      </header>

      <div className="lg:pl-60">
        <main className="min-h-screen pb-28 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-safe backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition-colors",
                  active ? "text-brand" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
