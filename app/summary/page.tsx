"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stat } from "@/components/ui/stat"
import { ProgressRing } from "@/components/ui/progress-ring"
import { PageContainer } from "@/components/page-container"
import { RoutineNameDialog } from "@/components/routine-name-dialog"
import { Check, Clock, Repeat, Target, Home, RotateCcw, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createSavedRoutine, getLastSummary, upsertSavedRoutine, type WorkoutSummary } from "@/lib/workout-store"
import { useToast } from "@/hooks/use-toast"

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

export default function SummaryPage() {
  const [summary, setSummary] = useState<WorkoutSummary | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setSummary(getLastSummary())
  }, [])

  if (!summary) {
    return (
      <PageContainer>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">No session found</h1>
          <p className="mt-2 text-sm text-muted-foreground">Complete a workout to see your summary here.</p>
          <Button asChild variant="brand" className="mt-6">
            <Link href="/workout">Start training</Link>
          </Button>
        </div>
      </PageContainer>
    )
  }

  const completionRate =
    summary.exercises > 0 ? Math.round((summary.completedExercises / summary.exercises) * 100) : 0
  const muscleGroups = Array.from(new Set(summary.workout.map((ex) => ex.muscleGroup)))
  const completedSets = summary.workout.reduce((sum, ex) => sum + ex.completedSets, 0)

  const saveAsRoutine = (name: string) => {
    const exercises = summary.workout.map(({ completedSets, isCompleted, ...exercise }) => exercise)
    upsertSavedRoutine(createSavedRoutine(name, exercises))
    toast({ title: "Routine saved", description: `${name} is available in My Routines` })
  }

  return (
    <PageContainer>
      {/* Result hero */}
      <section className="mb-8 flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 text-center shadow-soft sm:flex-row sm:justify-between sm:p-8 sm:text-left">
        <div>
          <p className="eyebrow mb-2 justify-center sm:justify-start">Session complete</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Well trained</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(summary.date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <ProgressRing value={completionRate} size={128} strokeWidth={11}>
          <span className="font-display text-3xl font-semibold tabular-nums">{completionRate}%</span>
          <span className="eyebrow mt-1">Complete</span>
        </ProgressRing>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Exercises"
          value={summary.completedExercises}
          hint={`of ${summary.exercises} planned`}
          icon={<Target className="h-4 w-4" />}
        />
        <Stat
          label="Sets"
          value={completedSets}
          hint={`of ${summary.totalSets} total`}
          icon={<Repeat className="h-4 w-4" />}
        />
        <Stat
          label="Duration"
          value={summary.duration}
          unit="min"
          icon={<Clock className="h-4 w-4" />}
        />
        <Stat
          label="Completion"
          value={`${completionRate}%`}
          accent={completionRate >= 100}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight">Muscle groups</h2>
          <span className="text-sm text-muted-foreground">({muscleGroups.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((group) => (
            <Badge key={group} variant="brand">
              {capitalize(group)}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">Exercise breakdown</h2>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {summary.workout.map((exercise, index) => (
            <div key={index} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    exercise.isCompleted ? "bg-brand/15 text-brand" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {exercise.isCompleted ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{exercise.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {exercise.muscleGroup} · {exercise.equipment}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-semibold tabular-nums">
                  {exercise.completedSets}/{exercise.sets}
                  <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">sets</span>
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">{exercise.reps} reps each</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="brand" size="lg" className="flex-1">
          <Link href="/workout">
            <RotateCcw className="h-4 w-4" />
            Train again
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link href="/progress">
            <TrendingUp className="h-4 w-4" />
            View progress
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={() => setSaveDialogOpen(true)}>
          Save as routine
        </Button>
        <Button asChild variant="ghost" size="lg" className="flex-1">
          <Link href="/">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>

      <RoutineNameDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        title="Save as routine"
        description="Keep this completed workout as a reusable routine for your next session."
        initialName={`Workout ${new Date(summary.date).toLocaleDateString()}`}
        submitLabel="Save routine"
        onSubmit={saveAsRoutine}
      />
    </PageContainer>
  )
}
