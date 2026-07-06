"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  Dumbbell,
  Flame,
  Play,
  Plus,
  TrendingUp,
  Clock,
  CalendarCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Stat } from "@/components/ui/stat"
import { ProgressRing } from "@/components/ui/progress-ring"
import { EmptyState } from "@/components/empty-state"
import { PageContainer } from "@/components/page-container"
import {
  getCurrentWorkout,
  getDashboardStats,
  getExercises,
  getHistory,
  getSettings,
  getWeeklySeries,
  type DashboardStats,
  type WeeklyPoint,
  type WorkoutExercise,
  type WorkoutSummary,
} from "@/lib/workout-store"

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

const formatVolume = (reps: number) => {
  if (reps >= 1000) return `${(reps / 1000).toFixed(1)}k`
  return `${reps}`
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [current, setCurrent] = useState<WorkoutExercise[]>([])
  const [series, setSeries] = useState<WeeklyPoint[]>([])

  useEffect(() => {
    // Load library (auto-seeds from sampleExercises.json when localStorage is empty).
    getExercises()

    const settings = getSettings()
    setStats(getDashboardStats(settings.weeklyGoal))
    setCurrent(getCurrentWorkout())
    setSeries(getWeeklySeries(8))
  }, [])

  const hasSession = current.length > 0
  const weeklyPct = stats && stats.weeklyGoal > 0 ? (stats.thisWeek / stats.weeklyGoal) * 100 : 0
  const maxVolume = Math.max(1, ...series.map((s) => s.volume))
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <PageContainer>
      <div className="mb-8">
        <p className="eyebrow mb-2">{dateLabel}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting()}
        </h1>
      </div>

      {/* Primary focus: today's session */}
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <p className="eyebrow mb-3">{hasSession ? "Session in progress" : "Today"}</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {hasSession ? "Continue your session" : "Ready to train"}
            </h2>
            <p className="mt-2 text-pretty text-sm text-muted-foreground">
              {hasSession
                ? `${current.length} exercise${current.length > 1 ? "s" : ""} queued. Pick up where you left off.`
                : "Build a focused routine in under a minute, then run it set by set."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {hasSession ? (
                <>
                  <Button asChild variant="brand" size="lg">
                    <Link href="/routine">
                      <Play className="h-4 w-4" />
                      Resume workout
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/workout">Edit routine</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="brand" size="lg">
                    <Link href="/workout">
                      <Play className="h-4 w-4" />
                      Start training
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/exercises">
                      <Plus className="h-4 w-4" />
                      Browse library
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <ProgressRing value={weeklyPct} size={148} strokeWidth={12}>
              <span className="font-display text-3xl font-semibold tabular-nums">
                {stats?.thisWeek ?? 0}
                <span className="text-lg text-muted-foreground">/{stats?.weeklyGoal ?? 0}</span>
              </span>
              <span className="eyebrow mt-1">This week</span>
            </ProgressRing>
          </div>
        </div>
      </section>

      {/* Meaningful metrics */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Streak"
          value={stats?.streak ?? 0}
          unit={stats?.streak === 1 ? "day" : "days"}
          icon={<Flame className="h-4 w-4" />}
          accent={(stats?.streak ?? 0) > 0}
          hint="Consecutive training days"
        />
        <Stat
          label="Workouts"
          value={stats?.totalWorkouts ?? 0}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint="Sessions completed"
        />
        <Stat
          label="Volume"
          value={formatVolume(stats?.totalVolume ?? 0)}
          unit="reps"
          icon={<TrendingUp className="h-4 w-4" />}
          hint="Total reps performed"
        />
        <Stat
          label="Time"
          value={stats?.totalMinutes ?? 0}
          unit="min"
          icon={<Clock className="h-4 w-4" />}
          hint="Total training minutes"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Weekly activity */}
        <section className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold tracking-tight">Weekly activity</h3>
            <Link
              href="/progress"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Details
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            {stats && stats.totalWorkouts > 0 ? (
              <div className="flex h-40 items-end justify-between gap-2 sm:gap-3">
                {series.map((point) => {
                  const height = point.volume > 0 ? Math.max(6, (point.volume / maxVolume) * 100) : 3
                  return (
                    <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-32 w-full items-end">
                        <div
                          className={
                            point.volume > 0
                              ? "w-full rounded-md bg-brand/80 transition-all"
                              : "w-full rounded-md bg-secondary"
                          }
                          style={{ height: `${height}%` }}
                          title={`${point.volume} reps · ${point.workouts} workout(s)`}
                        />
                      </div>
                      <span className="text-[0.65rem] text-muted-foreground">{point.label}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">
                  Your training volume will appear here after your first session.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Recent sessions */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold tracking-tight">Recent sessions</h3>
          </div>
          {stats?.lastWorkout ? (
            <RecentSessions />
          ) : (
            <EmptyState
              icon={<Dumbbell />}
              title="No sessions yet"
              description="Complete your first workout to start tracking progress."
              action={
                <Button asChild variant="brand">
                  <Link href="/workout">Start training</Link>
                </Button>
              }
            />
          )}
        </section>
      </div>
    </PageContainer>
  )
}

const RecentSessions = () => {
  const [sessions, setSessions] = useState<WorkoutSummary[]>([])

  useEffect(() => {
    setSessions(getHistory().slice(-5).reverse())
  }, [])

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {sessions.map((s, i) => {
        const rate = s.exercises > 0 ? Math.round((s.completedExercises / s.exercises) * 100) : 0
        return (
          <div key={`${s.date}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {new Date(s.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.completedExercises}/{s.exercises} exercises · {s.duration} min
              </p>
            </div>
            <span className="font-display text-sm font-semibold tabular-nums text-brand">{rate}%</span>
          </div>
        )
      })}
    </div>
  )
}
