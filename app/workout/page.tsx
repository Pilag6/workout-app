"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shuffle, Play, Dumbbell, User, Upload, Search, Filter, Plus, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>("all")
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>("all")

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const saved = localStorage.getItem("workout-exercises")
    if (saved) {
      setExercises(JSON.parse(saved))
    }
  }, [])

  // Filtered exercises based on search and filters
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMuscle = selectedMuscleFilter === "all" || exercise.muscleGroup === selectedMuscleFilter
      const matchesEquipment = selectedEquipmentFilter === "all" || exercise.equipment === selectedEquipmentFilter

      return matchesSearch && matchesMuscle && matchesEquipment
    })
  }, [exercises, searchTerm, selectedMuscleFilter, selectedEquipmentFilter])

  const toggleMuscleGroup = (group: string) => {
    setSelectedMuscleGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]))
  }

  const addExerciseToWorkout = (exercise: Exercise) => {
    const isAlreadyInWorkout = generatedWorkout.some(ex => ex.id === exercise.id)

    if (isAlreadyInWorkout) {
      toast({
        title: "Exercise already in workout",
        description: `${exercise.name} is already in your workout`,
        variant: "destructive",
      })
      return
    }

    const newWorkoutExercise: WorkoutExercise = {
      ...exercise,
      sets: 3,
      reps: 12,
    }

    setGeneratedWorkout(prev => [...prev, newWorkoutExercise])

    toast({
      title: "Exercise added!",
      description: `${exercise.name} added to your workout`,
    })
  }

  const handleWorkoutUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)

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

  const clearWorkout = () => {
    setGeneratedWorkout([])
    toast({
      title: "Workout cleared",
      description: "All exercises removed from workout",
    })
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
      <div className="mx-auto px-6 py-8 max-w-[95vw]">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Workout</h1>
        </div>

        <div className="grid lg:grid-cols-7 gap-8">
          {/* Left Column - Exercise Browser & Selection */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse">Browse Exercises</TabsTrigger>
                <TabsTrigger value="generate">Quick Generate</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-4">
                {/* Search and Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Search className="h-5 w-5 mr-2" />
                      Find Exercises
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="search">Search by name</Label>
                      <Input
                        id="search"
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label>Muscle Group</Label>
                        <Select value={selectedMuscleFilter} onValueChange={setSelectedMuscleFilter}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Groups</SelectItem>
                            {muscleGroups.map(group => (
                              <SelectItem key={group} value={group}>
                                {group.charAt(0).toUpperCase() + group.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Equipment</Label>
                        <Select value={selectedEquipmentFilter} onValueChange={setSelectedEquipmentFilter}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Equipment</SelectItem>
                            <SelectItem value="dumbbells">Dumbbells</SelectItem>
                            <SelectItem value="bodyweight">Bodyweight</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Exercise List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Exercises ({filteredExercises.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[65vh] overflow-y-auto">
                      {filteredExercises.map((exercise) => {
                        const isInWorkout = generatedWorkout.some(ex => ex.id === exercise.id)
                        return (
                          <div key={exercise.id} className="p-4 border rounded-lg hover:border-primary/20 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-3">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h4
                                    className="font-medium cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => openExerciseModal(exercise)}
                                  >
                                    {exercise.name}
                                  </h4>
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
                                      📹
                                    </Badge>
                                  )}
                                </div>
                                {exercise.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {exercise.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addExerciseToWorkout(exercise)}
                                disabled={isInWorkout}
                                className="shrink-0"
                              >
                                {isInWorkout ? (
                                  <>
                                    <X className="h-3 w-3 mr-1" />
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )
                      })}

                      {filteredExercises.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No exercises found matching your criteria</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="generate" className="space-y-4">
                {/* Import Workout */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Import Workout
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleWorkoutUpload}
                    />
                  </CardContent>
                </Card>

                {/* Quick Generate */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Generate</CardTitle>
                    <CardDescription>Select muscle groups for random workout</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      {muscleGroups.map((group) => (
                        <div key={group} className="flex items-center space-x-2">
                          <Checkbox
                            id={group}
                            checked={selectedMuscleGroups.includes(group)}
                            onCheckedChange={() => toggleMuscleGroup(group)}
                          />
                          <label htmlFor={group} className="text-sm cursor-pointer">
                            {group.charAt(0).toUpperCase() + group.slice(1)}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label>Exercises per group: {exercisesPerGroup}</Label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={exercisesPerGroup}
                        onChange={(e) => setExercisesPerGroup(Number(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>

                    <Button
                      onClick={generateWorkout}
                      className="w-full"
                      disabled={selectedMuscleGroups.length === 0}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Generate Workout
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Workout Editor */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      My Workout
                      {generatedWorkout.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {generatedWorkout.length} exercises
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {generatedWorkout.length > 0
                        ? "Edit sets, reps, and manage your workout"
                        : "Add exercises to build your workout"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {generatedWorkout.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearWorkout}
                        >
                          Clear All
                        </Button>
                        <Button onClick={startWorkout} size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Start Workout
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {generatedWorkout.length > 0 ? (
                  <div className="grid gap-4 max-h-[80vh] overflow-y-auto">
                    {generatedWorkout.map((exercise, index) => (
                      <div key={`${exercise.id}-${index}`} className="p-6 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3
                                className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => openExerciseModal(exercise)}
                              >
                                {exercise.name}
                              </h3>
                              <Badge variant="secondary" className="text-sm">
                                {exercise.muscleGroup}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1 text-sm">
                                {exercise.equipment === "dumbbells" ? (
                                  <Dumbbell className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                                {exercise.equipment}
                              </Badge>
                              {exercise.youtubeUrl && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 text-sm">
                                  📹 Video
                                </Badge>
                              )}
                            </div>
                            {exercise.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {exercise.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex items-center gap-3">
                            <Label className="text-base font-medium min-w-[40px]">Sets:</Label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, "sets", Number(e.target.value))}
                              className="w-20 px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <Label className="text-base font-medium min-w-[40px]">Reps:</Label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, "reps", Number(e.target.value))}
                              className="w-20 px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground ml-auto">
                            Total: {exercise.sets} × {exercise.reps} = {exercise.sets * exercise.reps} reps
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Dumbbell className="h-20 w-20 mx-auto mb-6 opacity-50" />
                    <h3 className="text-xl font-semibold mb-3">No exercises in workout</h3>
                    <p className="text-base max-w-md mx-auto">
                      Browse exercises on the left or generate a quick workout to get started!
                    </p>
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
