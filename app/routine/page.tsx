"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ProgressRing } from "@/components/ui/progress-ring"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Video,
  Search,
  GripVertical,
  Pause,
  Play,
} from "lucide-react"
import Link from "next/link"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  appendHistory,
  clearCurrentWorkout,
  getExercises,
  getCurrentWorkoutSession,
  getSettings,
  markRoutineCompleted,
  setCurrentWorkoutSession,
  setLastSummary,
  type ActiveRestState,
  type ActiveWorkoutSession,
  type Exercise,
  type ExerciseProgress,
  type WorkoutExercise,
} from "@/lib/workout-store"

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

export default function RoutinePage() {
  const [workout, setWorkout] = useState<WorkoutExercise[]>([])
  const [progress, setProgress] = useState<ExerciseProgress[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [rest, setRest] = useState<ActiveRestState | null>(null)
  const [restRemaining, setRestRemaining] = useState(0)
  const [restDuration, setRestDuration] = useState(60)
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [library, setLibrary] = useState<Exercise[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const session = getCurrentWorkoutSession()
    if (session && session.workout.length > 0) {
      setWorkout(session.workout)
      setProgress(session.progress)
      setCurrentExerciseIndex(session.currentExerciseIndex)
      setWorkoutStartTime(new Date(session.startedAt))
      setRest(session.rest)
      setRestDuration(getSettings().restSeconds)
      setLibrary(getExercises())
    } else {
      router.push("/workout")
    }
  }, [router])

  const persistSession = (
    nextWorkout = workout,
    nextProgress = progress,
    nextIndex = currentExerciseIndex,
    nextRest = rest,
  ) => {
    if (nextWorkout.length === 0) return
    const session: ActiveWorkoutSession = {
      version: 1,
      workout: nextWorkout,
      progress: nextProgress,
      currentExerciseIndex: nextIndex,
      startedAt: (workoutStartTime || new Date()).toISOString(),
      rest: nextRest,
    }
    setCurrentWorkoutSession(session)
  }

  useEffect(() => {
    if (!workoutStartTime) return
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - workoutStartTime.getTime()) / 1000 / 60))
    }, 1000)
    return () => clearInterval(interval)
  }, [workoutStartTime])

  useEffect(() => {
    if (!rest) {
      setRestRemaining(0)
      return
    }

    const syncRest = () => {
      const remaining = rest.isPaused || !rest.deadline ? rest.remainingSeconds : Math.max(0, Math.ceil((rest.deadline - Date.now()) / 1000))
      setRestRemaining(remaining)
      if (!rest.isPaused && rest.deadline && remaining <= 0) {
        setRest(null)
        setCurrentExerciseIndex(rest.nextExerciseIndex)
        persistSession(workout, progress, rest.nextExerciseIndex, null)
        toast({ title: "Rest complete", description: "Next exercise is ready" })
      }
    }

    syncRest()
    const interval = setInterval(syncRest, 500)
    return () => clearInterval(interval)
  }, [rest, workout, progress, toast])

  const completeSet = (exerciseIndex: number) => {
    if (exerciseIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(exerciseIndex)
      setRest(null)
    }

    const exercise = workout[exerciseIndex]
    const currentProgress = progress[exerciseIndex]

    if (currentProgress.completedSets < exercise.sets) {
      const newCompletedSets = currentProgress.completedSets + 1
      const isExerciseCompleted = newCompletedSets >= exercise.sets

      const nextProgress = progress.map((p, i) =>
        i === exerciseIndex ? { ...p, completedSets: newCompletedSets, isCompleted: isExerciseCompleted } : p,
      )
      setProgress(nextProgress)

      if (isExerciseCompleted) {
        toast({ title: "Exercise complete", description: `Nice work on ${exercise.name}` })
        if (exerciseIndex < workout.length - 1) {
          const nextRest: ActiveRestState = {
            deadline: Date.now() + restDuration * 1000,
            remainingSeconds: restDuration,
            isPaused: false,
            nextExerciseIndex: exerciseIndex + 1,
            durationSeconds: restDuration,
          }
          setRest(nextRest)
          persistSession(workout, nextProgress, exerciseIndex, nextRest)
        } else {
          persistSession(workout, nextProgress, exerciseIndex, null)
        }
      } else {
        const nextRest: ActiveRestState = {
          deadline: Date.now() + restDuration * 1000,
          remainingSeconds: restDuration,
          isPaused: false,
          nextExerciseIndex: exerciseIndex,
          durationSeconds: restDuration,
        }
        setRest(nextRest)
        persistSession(workout, nextProgress, exerciseIndex, nextRest)
      }
    }
  }

  const uncompleteSet = (exerciseIndex: number) => {
    const currentProgress = progress[exerciseIndex]
    if (currentProgress.completedSets > 0) {
      const newCompletedSets = currentProgress.completedSets - 1
      const nextProgress = progress.map((p, i) =>
        i === exerciseIndex ? { ...p, completedSets: newCompletedSets, isCompleted: false } : p,
      )
      setProgress(nextProgress)
      const nextRest = exerciseIndex === currentExerciseIndex ? null : rest
      setRest(nextRest)
      persistSession(workout, nextProgress, currentExerciseIndex, nextRest)
    }
  }

  const hasWorkoutProgress = () => progress.some((item) => item.completedSets > 0 || item.isCompleted)

  const canReorderExercise = (index: number) => {
    if (index < 0 || index >= workout.length || progress[index]?.isCompleted) return false
    if (!hasWorkoutProgress()) return true
    return index > currentExerciseIndex
  }

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (!canReorderExercise(fromIndex) || !canReorderExercise(toIndex) || fromIndex === toIndex) return

    let nextCurrentExerciseIndex = currentExerciseIndex
    if (fromIndex === currentExerciseIndex) {
      nextCurrentExerciseIndex = toIndex
    } else if (fromIndex < currentExerciseIndex && toIndex >= currentExerciseIndex) {
      nextCurrentExerciseIndex = currentExerciseIndex - 1
    } else if (fromIndex > currentExerciseIndex && toIndex <= currentExerciseIndex) {
      nextCurrentExerciseIndex = currentExerciseIndex + 1
    }

    const newWorkout = [...workout]
    const newProgress = [...progress]
    const [movedExercise] = newWorkout.splice(fromIndex, 1)
    newWorkout.splice(toIndex, 0, movedExercise)
    const [movedProgress] = newProgress.splice(fromIndex, 1)
    newProgress.splice(toIndex, 0, movedProgress)
    setWorkout(newWorkout)
    setProgress(newProgress)
    setCurrentExerciseIndex(nextCurrentExerciseIndex)
    persistSession(newWorkout, newProgress, nextCurrentExerciseIndex, rest)
  }

  const jumpToExercise = (index: number) => {
    setCurrentExerciseIndex(index)
    setRest(null)
    persistSession(workout, progress, index, null)
  }

  const skipRest = () => {
    if (!rest) return
    setRest(null)
    setCurrentExerciseIndex(rest.nextExerciseIndex)
    persistSession(workout, progress, rest.nextExerciseIndex, null)
  }

  const addRest = (seconds: number) => {
    if (!rest) return
    const nextRest = rest.isPaused
      ? { ...rest, remainingSeconds: rest.remainingSeconds + seconds, durationSeconds: rest.durationSeconds + seconds }
      : {
          ...rest,
          deadline: (rest.deadline || Date.now()) + seconds * 1000,
          durationSeconds: rest.durationSeconds + seconds,
        }
    setRest(nextRest)
    persistSession(workout, progress, currentExerciseIndex, nextRest)
  }

  const toggleRestPause = () => {
    if (!rest) return
    const remaining = Math.max(0, Math.ceil(((rest.deadline || Date.now()) - Date.now()) / 1000))
    const nextRest = rest.isPaused
      ? { ...rest, isPaused: false, deadline: Date.now() + rest.remainingSeconds * 1000 }
      : { ...rest, isPaused: true, deadline: null, remainingSeconds: remaining }
    setRest(nextRest)
    persistSession(workout, progress, currentExerciseIndex, nextRest)
  }

  const addExerciseToSession = (exercise: Exercise) => {
    if (workout.some((item) => item.id === exercise.id)) {
      toast({ title: "Already in workout", description: `${exercise.name} is already part of this session` })
      return
    }

    const added: WorkoutExercise = { ...exercise, sets: getSettings().defaultSets, reps: getSettings().defaultReps }
    const insertAt = Math.min(currentExerciseIndex + 1, workout.length)
    const nextWorkout = [...workout]
    const nextProgress = [...progress]
    nextWorkout.splice(insertAt, 0, added)
    nextProgress.splice(insertAt, 0, { exerciseId: exercise.id, completedSets: 0, isCompleted: false })
    const nextRest = rest ? { ...rest, nextExerciseIndex: insertAt } : rest
    setWorkout(nextWorkout)
    setProgress(nextProgress)
    setRest(nextRest)
    persistSession(nextWorkout, nextProgress, currentExerciseIndex, nextRest)
    toast({ title: "Exercise added", description: `${exercise.name} added after the current exercise` })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canReorderExercise(index)) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return
    moveExercise(draggedIndex, index)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

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
    markRoutineCompleted(workout, workoutSummary.date)
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
  const filteredLibrary = useMemo(
    () => {
      const workoutExerciseIds = new Set(workout.map((exercise) => exercise.id))
      return library.filter(
        (exercise) =>
          !workoutExerciseIds.has(exercise.id) && exercise.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    },
    [library, searchTerm, workout],
  )

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
  const isResting = Boolean(rest)
  const restPct = rest ? ((rest.durationSeconds - restRemaining) / rest.durationSeconds) * 100 : 0
  const nextExercise = rest ? workout[rest.nextExerciseIndex] : null

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
          <Button variant="ghost" size="icon-sm" onClick={() => setAddOpen(true)} aria-label="Add exercise">
            <Plus className="h-4 w-4" />
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
                <Button variant="outline" size="sm" onClick={() => openExerciseModal(current)}>
                  <Video className="h-4 w-4" />
                  <span className="hidden sm:inline">Watch video</span>
                </Button>
              </div>

              {isResting ? (
                <div className="mt-6 flex flex-col items-center rounded-xl border border-brand/30 bg-brand/5 px-4 py-6 text-center">
                  <ProgressRing value={restPct} size={132} strokeWidth={10}>
                    <span className="font-display text-4xl font-semibold tabular-nums">{restRemaining}</span>
                    <span className="eyebrow mt-1">Rest</span>
                  </ProgressRing>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {rest?.nextExerciseIndex === currentExerciseIndex ? "Next set" : "Next exercise"}: {" "}
                    <span className="font-medium text-foreground">{nextExercise?.name}</span>
                  </p>
                  <div className="mt-5 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => addRest(15)}>
                      <Plus className="h-3.5 w-3.5" />
                      15s
                    </Button>
                    <Button variant="outline" size="sm" onClick={toggleRestPause}>
                      {rest?.isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                      {rest?.isPaused ? "Resume" : "Pause"}
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
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {completedSets}/{totalSets} sets
                </span>
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {workout.map((exercise, index) => {
                const exProgress = progress[index]
                const isCurrent = index === currentExerciseIndex
                const isCompleted = exProgress?.isCompleted
                const canReorder = canReorderExercise(index)
                return (
                  <div
                    key={`${exercise.id}-${index}`}
                    onDragOver={(e) => {
                      if (!canReorder) return
                      e.preventDefault()
                      setDragOverIndex(index)
                    }}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={() => {
                      setDraggedIndex(null)
                      setDragOverIndex(null)
                    }}
                    className={`rounded-xl border p-3 transition-colors ${
                      dragOverIndex === index && draggedIndex !== null
                        ? "border-brand/50 bg-brand/5"
                        : isCurrent
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
                        {canReorder ? (
                          <button
                            type="button"
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            className="mr-1 rounded-md p-2 text-muted-foreground active:cursor-grabbing"
                            aria-label="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                        ) : null}
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
                          disabled={!canReorder || !canReorderExercise(index - 1)}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveExercise(index, index + 1)}
                          disabled={!canReorder || !canReorderExercise(index + 1)}
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
              disabled={isResting}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add exercises</DialogTitle>
            <DialogDescription>
              Added exercises appear after the current exercise and can be reordered while they are upcoming.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exercises"
              className="pl-9"
            />
          </div>
          <div className="space-y-2">
            {filteredLibrary.map((exercise) => (
              <div key={exercise.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <button
                  type="button"
                  onClick={() => openExerciseModal({ ...exercise, sets: getSettings().defaultSets, reps: getSettings().defaultReps })}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-medium">{exercise.name}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="capitalize">{capitalize(exercise.muscleGroup)}</Badge>
                    <span className="capitalize">{exercise.equipment}</span>
                    {exercise.youtubeUrl ? <Video className="h-3 w-3" /> : null}
                  </span>
                </button>
                <Button size="sm" variant="outline" onClick={() => addExerciseToSession(exercise)}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
