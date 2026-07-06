"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ProgressRing } from "@/components/ui/progress-ring"
import ExerciseModal from "@/components/ExerciseModal"
import {
  X,
  Check,
  SkipForward,
  Download,
  ChevronUp,
  ChevronDown,
  Undo2,
  Info,
  Plus,
  Flag,
  Timer,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  appendHistory,
  clearCurrentWorkout,
  getCurrentWorkout,
  getSettings,
  setCurrentWorkout,
  setLastSummary,
  type WorkoutExercise,
} from "@/lib/workout-store"

interface ExerciseProgress {
  exerciseId: string
  completedSets: number
  isCompleted: boolean
}

export default function RoutinePage() {
  const [workout, setWorkout] = useState<WorkoutExercise[]>([])
  const [progress, setProgress] = useState<ExerciseProgress[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restDuration, setRestDuration] = useState(60)
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const workoutData = getCurrentWorkout()
    if (workoutData.length > 0) {
      setWorkout(workoutData)
      setProgress(
        workoutData.map((ex) => ({ exerciseId: ex.id, completedSets: 0, isCompleted: false })),
      )
      setWorkoutStartTime(new Date())
      setRestDuration(getSettings().restSeconds)
    } else {
      router.push("/workout")
    }
  }, [router])

  useEffect(() => {
    if (!workoutStartTime) return
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - workoutStartTime.getTime()) / 1000 / 60))
    }, 1000)
    return () => clearInterval(interval)
  }, [workoutStartTime])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false)
            toast({ title: "Rest complete", description: "Ready for your next set" })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimer, toast])

  const completeSet = (exerciseIndex: number) => {
    if (exerciseIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(exerciseIndex)
      if (isResting) {
        setIsResting(false)
        setRestTimer(0)
      }
    }

    const exercise = workout[exerciseIndex]
    const currentProgress = progress[exerciseIndex]

    if (currentProgress.completedSets < exercise.sets) {
      const newCompletedSets = currentProgress.completedSets + 1
      const isExerciseCompleted = newCompletedSets >= exercise.sets

      setProgress((prev) =>
        prev.map((p, i) =>
          i === exerciseIndex ? { ...p, completedSets: newCompletedSets, isCompleted: isExerciseCompleted } : p,
        ),
      )

      if (isExerciseCompleted) {
        toast({ title: "Exercise complete", description: `Nice work on ${exercise.name}` })
        if (exerciseIndex < workout.length - 1) {
          setCurrentExerciseIndex(exerciseIndex + 1)
        }
      } else {
        setRestTimer(restDuration)
        setIsResting(true)
      }
    }
  }

  const uncompleteSet = (exerciseIndex: number) => {
    const currentProgress = progress[exerciseIndex]
    if (currentProgress.completedSets > 0) {
      const newCompletedSets = currentProgress.completedSets - 1
      setProgress((prev) =>
        prev.map((p, i) =>
          i === exerciseIndex ? { ...p, completedSets: newCompletedSets, isCompleted: false } : p,
        ),
      )
      if (exerciseIndex === currentExerciseIndex && isResting) {
        setIsResting(false)
        setRestTimer(0)
      }
    }
  }

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= workout.length) return
    const newWorkout = [...workout]
    const newProgress = [...progress]
    const [movedExercise] = newWorkout.splice(fromIndex, 1)
    newWorkout.splice(toIndex, 0, movedExercise)
    const [movedProgress] = newProgress.splice(fromIndex, 1)
    newProgress.splice(toIndex, 0, movedProgress)
    setCurrentExerciseIndex(0)
    setWorkout(newWorkout)
    setProgress(newProgress)
    setCurrentWorkout(newWorkout)
  }

  const jumpToExercise = (index: number) => {
    setCurrentExerciseIndex(index)
    if (isResting) {
      setIsResting(false)
      setRestTimer(0)
    }
  }

  const skipRest = () => {
    setIsResting(false)
    setRestTimer(0)
  }

  const addRest = (seconds: number) => setRestTimer((prev) => prev + seconds)

  const finishWorkout = () => {
    const completedExercises = progress.filter((p) => p.isCompleted).length
    const totalSets = workout.reduce((sum, ex) => sum + ex.sets, 0)
    const duration = workoutStartTime
      ? Math.round((Date.now() - workoutStartTime.getTime()) / 1000 / 60)
      : 0

    const workoutSummary = {
      date: new Date().toISOString(),
      exercises: workout.length,
      completedExercises,
      totalSets,
      duration,
      workout: workout.map((ex, i) => ({
        ...ex,
        completedSets: progress[i].completedSets,
        isCompleted: progress[i].isCompleted,
      })),
    }

    appendHistory(workoutSummary)
    setLastSummary(workoutSummary)
    clearCurrentWorkout()
    router.push("/summary")
  }

  const exportWorkout = () => {
    const workoutData = {
      name: `Workout ${new Date().toLocaleDateString()}`,
      exercises: workout.map((ex) => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        sets: ex.sets,
        reps: ex.reps,
        description: ex.description,
      })),
    }
    const dataBlob = new Blob([JSON.stringify(workoutData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `workout-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const openExerciseModal = (exercise: WorkoutExercise) => {
    setSelectedExercise(exercise)
    setIsModalOpen(true)
  }

  const totalExercises = workout.length
  const completedExercises = progress.filter((p) => p.isCompleted).length
  const overallProgress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0
  const totalSets = workout.reduce((sum, ex) => sum + ex.sets, 0)
  const completedSets = progress.reduce((sum, p) => sum + p.completedSets, 0)
  const allDone = totalExercises > 0 && completedExercises === totalExercises

  if (workout.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading session…
      </div>
    )
  }

  const current = workout[currentExerciseIndex]
  const currentProgress = progress[currentExerciseIndex]
  const currentSetNumber = Math.min((currentProgress?.completedSets || 0) + 1, current.sets)
  const restPct = restDuration > 0 ? ((restDuration - restTimer) / restDuration) * 100 : 0

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Session header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Exit workout">
            <Link href="/workout">
              <X className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-1 items-center gap-3">
            <span className="font-display text-sm font-semibold tabular-nums text-muted-foreground">
              {completedExercises}/{totalExercises}
            </span>
            <Progress value={overallProgress} className="h-1.5 flex-1" />
            <span className="hidden items-center gap-1 text-sm tabular-nums text-muted-foreground sm:flex">
              <Timer className="h-3.5 w-3.5" />
              {elapsed}m
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={exportWorkout} aria-label="Export routine">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Focus panel: current exercise */}
        <section className="animate-fade-in-up rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
          {allDone ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/15 text-brand">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">Every exercise done</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {completedSets} of {totalSets} sets completed in {elapsed} minutes.
              </p>
              <Button variant="brand" size="lg" className="mt-6" onClick={finishWorkout}>
                <Flag className="h-4 w-4" />
                Finish & save
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow mb-2">
                    Exercise {currentExerciseIndex + 1} of {totalExercises}
                  </p>
                  <button
                    type="button"
                    onClick={() => openExerciseModal(current)}
                    className="group inline-flex items-start gap-2 text-left"
                  >
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                      {current.name}
                    </h2>
                    <Info className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
                  </button>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {current.muscleGroup} · {current.equipment}
                  </p>
                </div>
              </div>

              {isResting ? (
                <div className="mt-6 flex flex-col items-center rounded-xl border border-brand/30 bg-brand/5 py-6">
                  <ProgressRing value={restPct} size={132} strokeWidth={10}>
                    <span className="font-display text-4xl font-semibold tabular-nums">{restTimer}</span>
                    <span className="eyebrow mt-1">Rest</span>
                  </ProgressRing>
                  <div className="mt-5 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => addRest(15)}>
                      <Plus className="h-3.5 w-3.5" />
                      15s
                    </Button>
                    <Button variant="brand" size="sm" onClick={skipRest}>
                      <SkipForward className="h-3.5 w-3.5" />
                      Skip rest
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-background p-4 text-center">
                      <div className="font-display text-4xl font-semibold tabular-nums leading-none">
                        {currentSetNumber}
                        <span className="text-xl text-muted-foreground">/{current.sets}</span>
                      </div>
                      <div className="eyebrow mt-2">Set</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4 text-center">
                      <div className="font-display text-4xl font-semibold tabular-nums leading-none">
                        {current.reps}
                      </div>
                      <div className="eyebrow mt-2">Reps</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-1.5">
                    {Array.from({ length: current.sets }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < (currentProgress?.completedSets || 0) ? "bg-brand" : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Session list */}
        {!allDone ? (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="eyebrow">Session</h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {completedSets}/{totalSets} sets
              </span>
            </div>
            <div className="space-y-2">
              {workout.map((exercise, index) => {
                const exProgress = progress[index]
                const isCurrent = index === currentExerciseIndex
                const isCompleted = exProgress?.isCompleted
                return (
                  <div
                    key={`${exercise.id}-${index}`}
                    className={`rounded-xl border p-3 transition-colors ${
                      isCurrent
                        ? "border-brand/40 bg-brand/5"
                        : isCompleted
                          ? "border-border bg-card/50"
                          : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => jumpToExercise(index)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                            isCompleted
                              ? "bg-brand/15 text-brand"
                              : isCurrent
                                ? "bg-brand text-brand-foreground"
                                : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{exercise.name}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {exProgress?.completedSets || 0}/{exercise.sets} sets · {exercise.reps} reps
                          </span>
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center">
                        {(exProgress?.completedSets || 0) > 0 ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => uncompleteSet(index)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Undo last set"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveExercise(index, index - 1)}
                          disabled={index === 0}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveExercise(index, index + 1)}
                          disabled={index === workout.length - 1}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}
      </main>

      {/* Primary action bar */}
      {!allDone ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 pb-safe backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <Button variant="outline" size="lg" onClick={finishWorkout} className="shrink-0">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Finish</span>
            </Button>
            <Button
              variant="brand"
              size="xl"
              onClick={() => completeSet(currentExerciseIndex)}
              className="flex-1"
            >
              <Check className="h-5 w-5" />
              Complete set {currentSetNumber}
            </Button>
          </div>
        </div>
      ) : null}

      <ExerciseModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={() => {
          setSelectedExercise(null)
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
