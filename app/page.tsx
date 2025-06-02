"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Home, Upload, Play, History } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [hasExercises, setHasExercises] = useState(false)
  const [recentWorkouts, setRecentWorkouts] = useState(0)

  useEffect(() => {
    const exercises = localStorage.getItem("workout-exercises")
    const workouts = localStorage.getItem("workout-history")
    setHasExercises(!!exercises)
    setRecentWorkouts(workouts ? JSON.parse(workouts).length : 0)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Dumbbell className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold">Home Workout Pro</h1>
          </div>
          <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your personal workout companion for home fitness. Create custom routines with dumbbells and bodyweight
            exercises, track your progress, and stay motivated on your fitness journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="h-5 w-5 mr-2" />
                Start Workout
              </CardTitle>
              <CardDescription>
                Create a new workout routine by selecting muscle groups and generating exercises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/workout">
                <Button className="w-full" size="lg" disabled={!hasExercises}>
                  {hasExercises ? "Create Workout" : "Add Exercises First"}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Manage Exercises
              </CardTitle>
              <CardDescription>
                Upload or edit your exercise database with custom muscle groups and equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/exercises">
                <Button variant="outline" className="w-full" size="lg">
                  {hasExercises ? "Edit Exercises" : "Add Exercises"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Home className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Home Friendly</h3>
                <p className="text-sm text-muted-foreground">Only dumbbells and bodyweight needed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Dumbbell className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Custom Routines</h3>
                <p className="text-sm text-muted-foreground">Generate workouts for any muscle group</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Link href="/summary" className="block">
                <div className="text-center">
                  <History className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Track Progress</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {recentWorkouts > 0 
                      ? `${recentWorkouts} workouts completed` 
                      : 'No workouts yet'}
                  </p>
                  <Button 
                    variant={recentWorkouts > 0 ? "default" : "outline"} 
                    size="sm" 
                    className="w-full"
                    disabled={recentWorkouts === 0}
                  >
                    {recentWorkouts > 0 ? "View Progress" : "No Progress Yet"}
                  </Button>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {!hasExercises && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Get Started</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To begin creating workouts, you'll need to add some exercises to your database first.
                </p>
                <Link href="/exercises">
                  <Button>Add Your First Exercises</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
