"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shuffle, Play, Dumbbell, User, Upload } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ExerciseModal from '@/components/ExerciseModal'

interface Exercise {
  id: string
  name: string
  muscleGroup: string
  equipment: "dumbbells" | "bodyweight"
  description?: string
  youtubeUrl?: string
}

interface WorkoutExercise extends Exercise {
  sets: number
  reps: number
}

const muscleGroups = ["chest", "back", "shoulders", "biceps", "triceps", "legs", "abs"]

export default function WorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutExercise[]>([])
  const [exercisesPerGroup, setExercisesPerGroup] = useState(3)
  const [manuallySelectedExercises, setManuallySelectedExercises] = useState<Exercise[]>([])
  const [showManualSelection, setShowManualSelection] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const saved = localStorage.getItem("workout-exercises")
    if (saved) {
      setExercises(JSON.parse(saved))
    }
  }, [])

  const toggleMuscleGroup = (group: string) => {
    setSelectedMuscleGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]))
  }

  const toggleManualExercise = (exercise: Exercise) => {
    setManuallySelectedExercises(prev => {
      const isSelected = prev.some(ex => ex.id === exercise.id)
      if (isSelected) {
        return prev.filter(ex => ex.id !== exercise.id)
      } else {
        return [...prev, exercise]
      }
    })
  }

  const addManualExercisesToWorkout = () => {
    const manualWorkoutExercises: WorkoutExercise[] = manuallySelectedExercises.map(exercise => ({
      ...exercise,
      sets: 3,
      reps: 12,
    }))

    setGeneratedWorkout(prev => {
      const existingIds = prev.map(ex => ex.id)
      const newExercises = manualWorkoutExercises.filter(ex => !existingIds.includes(ex.id))
      return [...prev, ...newExercises]
    })

    setManuallySelectedExercises([])
    setShowManualSelection(false)

    toast({
      title: "Exercises added!",
      description: `Added ${manualWorkoutExercises.length} exercises to your workout`,
    })
  }

  const handleWorkoutUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)

          // Handle the new workout format with name and exercises array
          if (data && data.exercises && Array.isArray(data.exercises)) {
            const validWorkoutExercises = data.exercises
              .filter((ex: any) =>
                ex.name && ex.muscleGroup && ex.equipment &&
                typeof ex.sets === 'number' && typeof ex.reps === 'number'
              )
              .map((ex: any) => ({
                ...ex,
                id: ex.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
              }))

            if (validWorkoutExercises.length > 0) {
              setGeneratedWorkout(validWorkoutExercises)
              toast({
                title: "Workout imported",
                description: `Successfully imported "${data.name || 'Untitled Workout'}" with ${validWorkoutExercises.length} exercises`
              })
            } else {
              toast({
                title: "Import failed",
                description: "No valid workout exercises found in file",
                variant: "destructive"
              })
            }
          }
          // Fallback for old format (direct array of exercises)
          else if (Array.isArray(data)) {
            const validWorkoutExercises = data
              .filter((ex) =>
                ex.name && ex.muscleGroup && ex.equipment &&
                typeof ex.sets === 'number' && typeof ex.reps === 'number'
              )
              .map((ex) => ({
                ...ex,
                id: ex.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
              }))

            if (validWorkoutExercises.length > 0) {
              setGeneratedWorkout(validWorkoutExercises)
              toast({
                title: "Workout imported",
                description: `Successfully imported ${validWorkoutExercises.length} exercises`
              })
            } else {
              toast({
                title: "Import failed",
                description: "No valid workout exercises found in file",
                variant: "destructive"
              })
            }
          } else {
            toast({
              title: "Import failed",
              description: "Invalid file format - expected workout with exercises array",
              variant: "destructive"
            })
          }
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid JSON file format",
            variant: "destructive"
          })
        }
      }
      reader.readAsText(file)
    }
  }

  const generateWorkout = () => {
    if (selectedMuscleGroups.length === 0) {
      toast({
        title: "No muscle groups selected",
        description: "Please select at least one muscle group",
        variant: "destructive",
      })
      return
    }

    const workout: WorkoutExercise[] = []

    selectedMuscleGroups.forEach((group) => {
      const groupExercises = exercises.filter((ex) => ex.muscleGroup === group)
      const availableExercises = groupExercises.filter(ex =>
        !generatedWorkout.some(workoutEx => workoutEx.id === ex.id)
      )
      const shuffled = [...availableExercises].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.min(exercisesPerGroup, availableExercises.length))

      selected.forEach((exercise) => {
        workout.push({
          ...exercise,
          sets: 3,
          reps: 12,
        })
      })
    })

    const combinedWorkout = [...generatedWorkout, ...workout]
    const shuffledWorkout = combinedWorkout.sort(() => Math.random() - 0.5)
    setGeneratedWorkout(shuffledWorkout)

    toast({
      title: "Workout generated!",
      description: `Created a workout with ${shuffledWorkout.length} exercises`,
    })
  }

  const startWorkout = () => {
    if (generatedWorkout.length === 0) {
      toast({
        title: "No workout to start",
        description: "Please generate a workout first",
        variant: "destructive",
      })
      return
    }

    localStorage.setItem("current-workout", JSON.stringify(generatedWorkout))
    router.push("/routine")
  }

  const updateExercise = (index: number, field: "sets" | "reps", value: number) => {
    const updated = [...generatedWorkout]
    updated[index] = { ...updated[index], [field]: Math.max(1, value) }
    setGeneratedWorkout(updated)
  }

  const removeExercise = (index: number) => {
    setGeneratedWorkout((prev) => prev.filter((_, i) => i !== index))
  }

  const getExerciseCountByGroup = (group: string) => {
    return exercises.filter((ex) => ex.muscleGroup === group).length
  }

  const getAvailableExercisesForManualSelection = () => {
    if (selectedMuscleGroups.length === 0) return []
    return exercises.filter(ex =>
      selectedMuscleGroups.includes(ex.muscleGroup) &&
      !generatedWorkout.some(workoutEx => workoutEx.id === ex.id)
    )
  }

  const openExerciseModal = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setIsModalOpen(true)
  }

  const closeExerciseModal = () => {
    setSelectedExercise(null)
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Workout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Import Workout
                </CardTitle>
                <CardDescription>
                  Upload a previously saved workout JSON file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workout-upload">Upload Workout JSON File</Label>
                  <Input
                    id="workout-upload"
                    type="file"
                    accept=".json"
                    onChange={handleWorkoutUpload}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Or Select Muscle Groups</CardTitle>
                <CardDescription>Choose which muscle groups you want to work out today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {muscleGroups.map((group) => {
                    const exerciseCount = getExerciseCountByGroup(group)
                    return (
                      <div key={group} className="flex items-center space-x-2">
                        <Checkbox
                          id={group}
                          checked={selectedMuscleGroups.includes(group)}
                          onCheckedChange={() => toggleMuscleGroup(group)}
                          disabled={exerciseCount === 0}
                        />
                        <label
                          htmlFor={group}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${exerciseCount === 0 ? "text-muted-foreground" : "cursor-pointer"
                            }`}
                        >
                          {group.charAt(0).toUpperCase() + group.slice(1)} ({exerciseCount})
                        </label>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <label className="text-sm font-medium mb-2 block">
                    Exercises per muscle group: {exercisesPerGroup}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={exercisesPerGroup}
                    onChange={(e) => setExercisesPerGroup(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span>5</span>
                  </div>
                </div>
              </CardContent>
            </Card>



            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={generateWorkout}
                  className="w-full"
                  size="lg"
                  disabled={selectedMuscleGroups.length === 0}
                >
                  <Shuffle className="h-5 w-5 mr-2" />
                  Generate Random Workout
                </Button>

                <Button
                  onClick={() => setShowManualSelection(!showManualSelection)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={selectedMuscleGroups.length === 0}
                >
                  <User className="h-5 w-5 mr-2" />
                  {showManualSelection ? 'Hide' : 'Show'} Manual Selection
                </Button>
              </CardContent>
            </Card>

            {showManualSelection && (
              <Card>
                <CardHeader>
                  <CardTitle>Manual Exercise Selection</CardTitle>
                  <CardDescription>
                    Choose specific exercises from your selected muscle groups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {getAvailableExercisesForManualSelection().map((exercise) => (
                      <div key={exercise.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={`manual-${exercise.id}`}
                          checked={manuallySelectedExercises.some(ex => ex.id === exercise.id)}
                          onCheckedChange={() => toggleManualExercise(exercise)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <label
                              htmlFor={`manual-${exercise.id}`}
                              className="font-medium cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                openExerciseModal(exercise)
                              }}
                            >
                              {exercise.name}
                            </label>
                            <Badge variant="secondary" className="text-xs">
                              {exercise.muscleGroup}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              {exercise.equipment === "dumbbells" ? (
                                <Dumbbell className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              {exercise.equipment}
                            </Badge>
                            {exercise.youtubeUrl && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                                📹 Video
                              </Badge>
                            )}
                          </div>
                          {exercise.description && (
                            <p className="text-xs text-muted-foreground">{exercise.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {manuallySelectedExercises.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={addManualExercisesToWorkout}
                        className="w-full py-6"
                        size="sm"
                      >
                        Add {manuallySelectedExercises.length} Selected Exercise{manuallySelectedExercises.length !== 1 ? 's' : ''} to Workout
                      </Button>
                    </div>
                  )}

                  {getAvailableExercisesForManualSelection().length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No exercises available. Select muscle groups first or all exercises are already in your workout.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Generated Workout
                  {generatedWorkout.length > 0 && (
                    <Button onClick={startWorkout} size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Start Workout
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {generatedWorkout.length > 0
                    ? `${generatedWorkout.length} exercises ready to go`
                    : "Generate a workout to see exercises here"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedWorkout.length > 0 ? (
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {generatedWorkout.map((exercise, index) => (
                      <div key={`${exercise.id}-${index}`} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => openExerciseModal(exercise)}
                              >
                                {exercise.name}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {exercise.muscleGroup}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                {exercise.equipment === "dumbbells" ? (
                                  <Dumbbell className="h-3 w-3" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                                {exercise.equipment}
                              </Badge>
                              {exercise.youtubeUrl && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                                  📹 Video
                                </Badge>
                              )}
                            </div>
                            {exercise.description && (
                              <p className="text-xs text-muted-foreground mb-2">{exercise.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Sets:</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, "sets", Number(e.target.value))}
                              className="w-16 px-2 py-1 text-sm border rounded"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Reps:</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, "reps", Number(e.target.value))}
                              className="w-16 px-2 py-1 text-sm border rounded"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shuffle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select muscle groups and generate a workout to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
