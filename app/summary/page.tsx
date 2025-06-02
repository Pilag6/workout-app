"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Clock, Target, Repeat, Home, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface WorkoutSummary {
  date: string
  exercises: number
  completedExercises: number
  totalSets: number
  duration: number
  workout: Array<{
    name: string
    muscleGroup: string
    equipment: string
    sets: number
    reps: number
    completedSets: number
    isCompleted: boolean
  }>
}

export default function SummaryPage() {
  const [summary, setSummary] = useState<WorkoutSummary | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("workout-summary")
    if (saved) {
      setSummary(JSON.parse(saved))
      localStorage.removeItem("workout-summary")
    }
  }, [])

  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No workout summary found</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const completionRate = summary.exercises > 0 ? (summary.completedExercises / summary.exercises) * 100 : 0
  const muscleGroups = [...new Set(summary.workout.map((ex) => ex.muscleGroup))]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-4xl font-bold mb-2">Workout Complete!</h1>
          <p className="text-xl text-muted-foreground">Great job on finishing your workout session</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{summary.completedExercises}</div>
              <div className="text-sm text-muted-foreground">Exercises Completed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Repeat className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{summary.totalSets}</div>
              <div className="text-sm text-muted-foreground">Total Sets</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{summary.duration}</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Muscle Groups Trained</CardTitle>
              <CardDescription>You worked on {muscleGroups.length} different muscle groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map((group) => (
                  <Badge key={group} variant="secondary">
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout Breakdown</CardTitle>
              <CardDescription>Equipment used in your session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["dumbbells", "bodyweight"].map((equipment) => {
                  const count = summary.workout.filter((ex) => ex.equipment === equipment).length
                  if (count === 0) return null
                  return (
                    <div key={equipment} className="flex justify-between">
                      <span className="capitalize">{equipment}</span>
                      <span className="font-semibold">{count} exercises</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Exercise Details</CardTitle>
            <CardDescription>Complete breakdown of your workout session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.workout.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${exercise.isCompleted ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <div className="font-semibold">{exercise.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {exercise.muscleGroup} • {exercise.equipment}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {exercise.completedSets} / {exercise.sets} sets
                    </div>
                    <div className="text-sm text-muted-foreground">{exercise.reps} reps each</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" size="lg">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/workout">
            <Button size="lg">
              <RotateCcw className="h-5 w-5 mr-2" />
              Start New Workout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
