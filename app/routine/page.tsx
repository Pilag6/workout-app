"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, Clock, SkipForward, Download } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface WorkoutExercise {
  id: string
  name: string
  muscleGroup: string
  equipment: "dumbbells" | "bodyweight"
  description?: string
  sets: number
  reps: number
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
        // Auto-advance to next exercise
        if (exerciseIndex < workout.length - 1) {
          setCurrentExerciseIndex(exerciseIndex + 1)
        }
      } else {
        // Start rest timer
        setRestTimer(60) // 60 seconds rest
        setIsResting(true)
        toast({
          title: "Set completed!",
          description: "Take a 60-second rest",
        })
      }
    }
  }

  const skipRest = () => {
    setIsResting(false)
    setRestTimer(0)
  }

  const finishWorkout = () => {
    const completedExercises = progress.filter((p) => p.isCompleted).length
    const totalSets = progress.reduce((sum, p) => sum + p.completedSets, 0)
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

    // Save to history
    const history = JSON.parse(localStorage.getItem("workout-history") || "[]")
    history.push(workoutSummary)
    localStorage.setItem("workout-history", JSON.stringify(history))

    // Clear current workout
    localStorage.removeItem("current-workout")

    // Navigate to summary
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

  const totalExercises = workout.length
  const completedExercises = progress.filter((p) => p.isCompleted).length
  const overallProgress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

  if (workout.length === 0) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/workout">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Active Workout</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportWorkout}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={finishWorkout} variant="destructive" size="sm">
              Finish Workout
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedExercises} / {totalExercises} exercises
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {isResting && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <h3 className="font-semibold mb-2">Rest Time</h3>
                <div className="text-2xl font-bold mb-4">{restTimer}s</div>
                <Button onClick={skipRest} variant="outline">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip Rest
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {workout.map((exercise, index) => {
            const exerciseProgress = progress[index]
            const isCurrent = index === currentExerciseIndex
            const isCompleted = exerciseProgress?.isCompleted

            return (
              <Card
                key={`${exercise.id}-${index}`}
                className={`${isCurrent ? "ring-2 ring-primary" : ""} ${isCompleted ? "opacity-75" : ""}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {isCompleted && <Check className="h-5 w-5 text-green-500" />}
                      {exercise.name}
                      {isCurrent && <Badge variant="default">Current</Badge>}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{exercise.muscleGroup}</Badge>
                      <Badge variant="outline">{exercise.equipment}</Badge>
                    </div>
                  </div>
                  {exercise.description && <CardDescription>{exercise.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold">
                      {exercise.sets} sets × {exercise.reps} reps
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exerciseProgress?.completedSets || 0} / {exercise.sets} sets completed
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-4">
                    {Array.from({ length: exercise.sets }, (_, setIndex) => (
                      <Button
                        key={setIndex}
                        variant={setIndex < (exerciseProgress?.completedSets || 0) ? "default" : "outline"}
                        size="sm"
                        onClick={() => completeSet(index)}
                        disabled={setIndex !== (exerciseProgress?.completedSets || 0) || isCompleted}
                        className="min-w-[60px]"
                      >
                        {setIndex < (exerciseProgress?.completedSets || 0) ? (
                          <Check className="h-4 w-4" />
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
      </div>
    </div>
  )
}
