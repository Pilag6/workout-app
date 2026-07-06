"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Flame,
  CalendarCheck,
  TrendingUp,
  Clock,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Stat } from "@/components/ui/stat"
import { EmptyState } from "@/components/empty-state"
import { PageContainer } from "@/components/page-container"
import {
  getDashboardStats,
  getHistory,
  getMuscleDistribution,
  getSettings,
  getWeeklySeries,
  type DashboardStats,
  type MuscleDistribution,
  type WeeklyPoint,
  type WorkoutSummary,
} from "@/lib/workout-store"

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const formatVolume = (reps: number) => (reps >= 1000 ? `${(reps / 1000).toFixed(1)}k` : `${reps}`)

const ChartTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-elevated">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-semibold tabular-nums">
        {payload[0].value}
        {unit ? <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">{unit}</span> : null}
      </p>
    </div>
  )
}

export default function ProgressPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [series, setSeries] = useState<WeeklyPoint[]>([])
  const [distribution, setDistribution] = useState<MuscleDistribution[]>([])
  const [history, setHistory] = useState<WorkoutSummary[]>([])

  useEffect(() => {
    const settings = getSettings()
    setStats(getDashboardStats(settings.weeklyGoal))
    setSeries(getWeeklySeries(8))
    setDistribution(getMuscleDistribution())
    setHistory(getHistory())
  }, [])

  const volumeDelta = useMemo(() => {
    if (series.length < 2) return null
    const current = series[series.length - 1].volume
    const previous = series[series.length - 2].volume
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }, [series])

  const records = useMemo(() => {
    if (history.length === 0) return null
    const longest = history.reduce((a, b) => (b.duration > a.duration ? b : a))
    const mostVolume = history.reduce((a, b) => {
      const av = a.workout.reduce((s, e) => s + e.completedSets * e.reps, 0)
      const bv = b.workout.reduce((s, e) => s + e.completedSets * e.reps, 0)
      return bv > av ? b : a
    })
    const mostExercises = history.reduce((a, b) => (b.completedExercises > a.completedExercises ? b : a))
    return {
      longest: longest.duration,
      mostVolume: mostVolume.workout.reduce((s, e) => s + e.completedSets * e.reps, 0),
      mostExercises: mostExercises.completedExercises,
    }
  }, [history])

  const maxMuscle = Math.max(1, ...distribution.map((d) => d.count))
  const hasData = (stats?.totalWorkouts ?? 0) > 0

  return (
    <PageContainer>
      <div className="mb-8">
        <p className="eyebrow mb-2">Analytics</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Progress</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track consistency, volume and where your training is focused.
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 />}
          title="No data to analyze yet"
          description="Complete a few sessions and your trends, records and muscle focus will appear here."
          action={
            <Button asChild variant="brand">
              <Link href="/workout">Start training</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat
              label="Streak"
              value={stats?.streak ?? 0}
              unit={stats?.streak === 1 ? "day" : "days"}
              icon={<Flame className="h-4 w-4" />}
              accent={(stats?.streak ?? 0) > 0}
            />
            <Stat
              label="This week"
              value={`${stats?.thisWeek ?? 0}/${stats?.weeklyGoal ?? 0}`}
              hint="Weekly goal"
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <Stat
              label="Avg completion"
              value={`${stats?.avgCompletion ?? 0}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <Stat
              label="Total time"
              value={stats?.totalMinutes ?? 0}
              unit="min"
              icon={<Clock className="h-4 w-4" />}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Volume trend */}
            <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold tracking-tight">Training volume</h2>
                  <p className="text-xs text-muted-foreground">Reps per week, last 8 weeks</p>
                </div>
                {volumeDelta !== null ? <DeltaPill value={volumeDelta} /> : null}
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip content={<ChartTooltip unit="reps" />} cursor={{ stroke: "hsl(var(--border))" }} />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="hsl(var(--brand))"
                      strokeWidth={2}
                      fill="url(#volumeFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Workouts per week */}
            <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-4">
                <h2 className="font-display text-base font-semibold tracking-tight">Frequency</h2>
                <p className="text-xs text-muted-foreground">Workouts per week, last 8 weeks</p>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      content={<ChartTooltip unit="workouts" />}
                      cursor={{ fill: "hsl(var(--secondary))", opacity: 0.4 }}
                    />
                    <Bar dataKey="workouts" fill="hsl(var(--brand))" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Muscle focus */}
          <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-display text-base font-semibold tracking-tight">Muscle focus</h2>
            {distribution.length > 0 ? (
              <div className="space-y-3">
                {distribution.map((item) => (
                  <div key={item.muscleGroup} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm capitalize text-muted-foreground">
                      {item.muscleGroup}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500 ease-out-expo"
                        style={{ width: `${(item.count / maxMuscle) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-display text-sm font-semibold tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete exercises to see which muscle groups you train most.
              </p>
            )}
          </section>

          {/* Personal records */}
          {records ? (
            <section className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-brand" />
                <h2 className="font-display text-lg font-semibold tracking-tight">Personal records</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat label="Longest session" value={records.longest} unit="min" />
                <Stat label="Biggest volume" value={formatVolume(records.mostVolume)} unit="reps" />
                <Stat label="Most exercises" value={records.mostExercises} />
              </div>
            </section>
          ) : null}
        </>
      )}
    </PageContainer>
  )
}

const DeltaPill = ({ value }: { value: number }) => {
  const positive = value > 0
  const neutral = value === 0
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
        neutral
          ? "bg-secondary text-muted-foreground"
          : positive
            ? "bg-success/12 text-success"
            : "bg-destructive/12 text-destructive"
      }`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value)}% vs last week
    </span>
  )
}
