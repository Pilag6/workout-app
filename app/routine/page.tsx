"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, Clock, SkipForward, Download, ChevronUp, ChevronDown, GripVertical, Undo2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import ExerciseModal from '@/components/ExerciseModal'

interface WorkoutExercise {
  id: string
  name: string
  muscleGroup: string
  equipment: "dumbbells" | "bodyweight"
  description?: string
  sets: number
  reps: number
  youtubeUrl?: string
}

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
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const saved = localStorage.getItem("current-workout")
    if (saved) {
      const workoutData = JSON.parse(saved)
      setWorkout(workoutData)
      setProgress(
        workoutData.map((ex: WorkoutExercise) => ({
          exerciseId: ex.id,
          completedSets: 0,
          isCompleted: false,
        })),
      )
      setWorkoutStartTime(new Date())
    } else {
      router.push("/workout")
    }
  }, [router])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false)
            toast({
              title: "Rest complete!",
              description: "Ready for your next set",
            })
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
        toast({
          title: "Exercise completed!",
          description: `Great job on ${exercise.name}`,
        })
        if (exerciseIndex < workout.length - 1) {
          setCurrentExerciseIndex(exerciseIndex + 1)
        }
      } else {
        setRestTimer(60)
        setIsResting(true)
        toast({
          title: "Set completed!",
          description: "Take a 60-second rest",
        })
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

      toast({
        title: "Set uncompleted",
        description: "You can now redo this set",
        variant: "default"
      })
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

    localStorage.setItem("current-workout", JSON.stringify(newWorkout))
  }

  const moveExerciseUp = (index: number) => {
    if (index > 0) {
      moveExercise(index, index - 1)
    }
  }

  const moveExerciseDown = (index: number) => {
    if (index < workout.length - 1) {
      moveExercise(index, index + 1)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', '')
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    moveExercise(draggedIndex, dropIndex)
    setDraggedIndex(null)
    setDragOverIndex(null)

    const draggedExercise = workout[draggedIndex]
    toast({
      title: "Exercise reordered",
      description: `Moved ${draggedExercise.name} to position ${dropIndex + 1}`,
    })
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const skipRest = () => {
    setIsResting(false)
    setRestTimer(0)
  }

  const finishWorkout = () => {
    const completedExercises = progress.filter((p) => p.isCompleted).length
    const totalSets = workout.reduce((sum, ex) => sum + ex.sets, 0)
    const duration = workoutStartTime ? Math.round((Date.now() - workoutStartTime.getTime()) / 1000 / 60) : 0

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

    const history = JSON.parse(localStorage.getItem("workout-history") || "[]")
    history.push(workoutSummary)
    localStorage.setItem("workout-history", JSON.stringify(history))

    localStorage.removeItem("current-workout")

    localStorage.setItem("workout-summary", JSON.stringify(workoutSummary))
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

    const dataStr = JSON.stringify(workoutData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
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

  const closeExerciseModal = () => {
    setSelectedExercise(null)
    setIsModalOpen(false)
  }

  const totalExercises = workout.length
  const completedExercises = progress.filter((p) => p.isCompleted).length
  const overallProgress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0
  const totalSets = workout.reduce((sum, ex) => sum + ex.sets, 0)
  const completedSets = progress.reduce((sum, p) => sum + p.completedSets, 0)

  if (workout.length === 0) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-3 sm:gap-0">
          <div className="flex items-center">
            <Link href="/workout">
              <Button variant="ghost" size="sm" className="mr-2 sm:mr-4">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Active Workout</h1>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" onClick={exportWorkout} className="h-8 sm:h-9">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={finishWorkout} variant="destructive" size="sm" className="h-8 sm:h-9">
              <span className="hidden sm:inline">Finish Workout</span>
              <span className="sm:hidden">Finish</span>
            </Button>
          </div>
        </div>

        <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center mb-3 sm:mb-4">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">
                {Math.round(overallProgress)}%
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Workout Progress</p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Progress value={overallProgress} className="h-2 sm:h-3" />

              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold">{completedExercises}</div>
                  <div className="text-xs text-muted-foreground">of {totalExercises} exercises</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold">{completedSets}</div>
                  <div className="text-xs text-muted-foreground">of {totalSets} sets</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold">
                    {workoutStartTime ? Math.round((Date.now() - workoutStartTime.getTime()) / 1000 / 60) : 0}m
                  </div>
                  <div className="text-xs text-muted-foreground">duration</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 sm:space-y-4">
          {workout.map((exercise, index) => {
            const exerciseProgress = progress[index]
            const isCurrent = index === currentExerciseIndex
            const isCompleted = exerciseProgress?.isCompleted
            const isCurrentAndResting = isCurrent && isResting

            return (
              <Card
                key={`${exercise.id}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing ${isCurrent ? "ring-2 ring-primary shadow-lg bg-primary/5 border-primary/20" : ""
                  } ${isCompleted ? "opacity-75" : ""
                  } ${isCurrentAndResting ? "ring-4 ring-amber-400 shadow-amber-200 shadow-lg bg-amber-50/50 border-amber-200" : ""
                  } ${draggedIndex === index
                    ? "opacity-50 scale-95 z-50"
                    : dragOverIndex === index && draggedIndex !== null
                      ? "bg-primary/5 border-primary/30 scale-102 shadow-lg ring-2 ring-primary/20"
                      : "hover:shadow-md"
                  }`}
              >
                {isCurrentAndResting && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-amber-100/30 to-amber-200/30 dark:from-amber-900/20 dark:to-amber-800/20"
                      style={{
                        animation: `pulse 2s ease-in-out infinite`
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-300/40 to-amber-400/40 transition-all duration-1000 ease-linear"
                      style={{
                        width: `${((60 - restTimer) / 60) * 100}%`
                      }}
                    />
                  </div>
                )}

                <CardHeader className="pb-3 sm:pb-4 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground cursor-grab active:cursor-grabbing touch-manipulation" />

                      {isCompleted && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
                      <span
                        className="cursor-pointer hover:text-primary transition-colors text-base sm:text-lg font-semibold"
                        onClick={() => openExerciseModal(exercise)}
                      >
                        {exercise.name}
                      </span>
                      {isCurrent && !isCurrentAndResting && <Badge variant="default" className="text-xs">Current</Badge>}
                      {isCurrentAndResting && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Rest: {restTimer}s
                          </Badge>
                          <Button
                            onClick={skipRest}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2 touch-manipulation"
                          >
                            <SkipForward className="h-3 w-3 mr-1" />
                            Skip
                          </Button>
                        </div>
                      )}
                    </CardTitle>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex flex-col order-last sm:order-none">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveExerciseUp(index)}
                          disabled={index === 0}
                          className="h-6 w-8 p-0 touch-manipulation"
                        >
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveExerciseDown(index)}
                          disabled={index === workout.length - 1}
                          className="h-6 w-8 p-0 touch-manipulation"
                        >
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>

                      <div className="flex gap-1 sm:gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{exercise.muscleGroup}</Badge>
                        <Badge variant="outline" className="text-xs">{exercise.equipment}</Badge>
                        {exercise.youtubeUrl && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                            📹<span className="hidden sm:inline ml-1">Video</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {exercise.description && (
                    <CardDescription className="text-xs sm:text-sm mt-2">{exercise.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                    <div className="text-sm sm:text-base md:text-lg font-semibold">
                      {exercise.sets} sets × {exercise.reps} reps
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {exerciseProgress?.completedSets || 0} / {exercise.sets} sets completed
                      </span>
                      {exerciseProgress?.completedSets > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => uncompleteSet(index)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive touch-manipulation"
                          title="Undo last set"
                        >
                          <Undo2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:flex gap-2 mb-3 sm:mb-4">
                    {Array.from({ length: exercise.sets }, (_, setIndex) => (
                      <Button
                        key={setIndex}
                        variant={setIndex < (exerciseProgress?.completedSets || 0) ? "default" : "outline"}
                        size="sm"
                        onClick={() => completeSet(index)}
                        disabled={setIndex !== (exerciseProgress?.completedSets || 0) || isCompleted}
                        className="min-w-[60px] h-9 sm:h-10 text-xs sm:text-sm touch-manipulation"
                      >
                        {setIndex < (exerciseProgress?.completedSets || 0) ? (
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          `Set ${setIndex + 1}`
                        )}
                      </Button>
                    ))}
                  </div>

                  <Progress
                    value={exerciseProgress ? (exerciseProgress.completedSets / exercise.sets) * 100 : 0}
                    className="h-2"
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>

        <ExerciseModal
          exercise={selectedExercise}
          isOpen={isModalOpen}
          onClose={closeExerciseModal}
        />
      </div>
    </div>
  )
}
