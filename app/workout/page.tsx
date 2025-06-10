"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shuffle, Play, Dumbbell, User, Upload, Search, Filter, Plus, X, ChevronUp, ChevronDown, GripVertical } from "lucide-react"
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

  // Drag & Drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

  // Drag & Drop functions
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

    const newWorkout = [...generatedWorkout]
    const draggedItem = newWorkout[draggedIndex]

    newWorkout.splice(draggedIndex, 1)
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    newWorkout.splice(adjustedDropIndex, 0, draggedItem)

    setGeneratedWorkout(newWorkout)
    setDraggedIndex(null)
    setDragOverIndex(null)

    toast({
      title: "Exercise reordered",
      description: `Moved ${draggedItem.name} to position ${adjustedDropIndex + 1}`,
    })
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Arrow movement functions
  const moveExerciseUp = (index: number) => {
    if (index === 0) return

    const newWorkout = [...generatedWorkout]
    const temp = newWorkout[index]
    newWorkout[index] = newWorkout[index - 1]
    newWorkout[index - 1] = temp

    setGeneratedWorkout(newWorkout)

    toast({
      title: "Exercise moved up",
      description: `Moved ${temp.name} up one position`,
    })
  }

  const moveExerciseDown = (index: number) => {
    if (index === generatedWorkout.length - 1) return

    const newWorkout = [...generatedWorkout]
    const temp = newWorkout[index]
    newWorkout[index] = newWorkout[index + 1]
    newWorkout[index + 1] = temp

    setGeneratedWorkout(newWorkout)

    toast({
      title: "Exercise moved down",
      description: `Moved ${temp.name} down one position`,
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
      <div className="mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-[95vw]">
        <div className="flex items-center mb-6 sm:mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">Create Workout</h1>
        </div>

        {/* Mobile/Tablet: Stack layout, Desktop: Side by side */}
        <div className="flex flex-col lg:grid lg:grid-cols-7 gap-4 sm:gap-6 lg:gap-8">
          {/* Exercise Browser & Selection */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse" className="text-sm">Browse Exercises</TabsTrigger>
                <TabsTrigger value="generate" className="text-sm">Quick Generate</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-4">
                {/* Search and Filters */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Search className="h-5 w-5 mr-2" />
                      Find Exercises
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="search" className="text-sm">Search by name</Label>
                      <Input
                        id="search"
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1 h-10"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Muscle Group</Label>
                        <Select value={selectedMuscleFilter} onValueChange={setSelectedMuscleFilter}>
                          <SelectTrigger className="mt-1 h-10">
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
                        <Label className="text-sm">Equipment</Label>
                        <Select value={selectedEquipmentFilter} onValueChange={setSelectedEquipmentFilter}>
                          <SelectTrigger className="mt-1 h-10">
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

                    {/* Clear Filters Button */}
                    {(searchTerm || selectedMuscleFilter !== "all" || selectedEquipmentFilter !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("")
                          setSelectedMuscleFilter("all")
                          setSelectedEquipmentFilter("all")
                        }}
                        className="w-full h-10"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Exercise List */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Available Exercises ({filteredExercises.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[50vh] sm:max-h-[60vh] lg:max-h-[65vh] overflow-y-auto">
                      {filteredExercises.map((exercise) => {
                        const isInWorkout = generatedWorkout.some(ex => ex.id === exercise.id)
                        return (
                          <div key={exercise.id} className="p-4 border rounded-lg hover:border-primary/20 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h4
                                    className="font-medium cursor-pointer hover:text-primary transition-colors truncate"
                                    onClick={() => openExerciseModal(exercise)}
                                  >
                                    {exercise.name}
                                  </h4>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {exercise.muscleGroup}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs shrink-0">
                                    {exercise.equipment === "dumbbells" ? (
                                      <Dumbbell className="h-3 w-3" />
                                    ) : (
                                      <User className="h-3 w-3" />
                                    )}
                                    <span className="hidden sm:inline">{exercise.equipment}</span>
                                  </Badge>
                                  {exercise.youtubeUrl && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 text-xs shrink-0">
                                      📹 Video
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
                                className="shrink-0 h-9 px-3"
                              >
                                {isInWorkout ? (
                                  <>
                                    <X className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Added</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Add</span>
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
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Upload className="h-5 w-5 mr-2" />
                      Import Workout
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleWorkoutUpload}
                      className="h-10"
                    />
                  </CardContent>
                </Card>

                {/* Quick Generate */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Quick Generate</CardTitle>
                    <CardDescription>Select muscle groups for random workout</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {muscleGroups.map((group) => (
                        <div key={group} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={group}
                            checked={selectedMuscleGroups.includes(group)}
                            onCheckedChange={() => toggleMuscleGroup(group)}
                            className="h-5 w-5"
                          />
                          <label htmlFor={group} className="text-sm cursor-pointer">
                            {group.charAt(0).toUpperCase() + group.slice(1)}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label className="text-sm">Exercises per group: {exercisesPerGroup}</Label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={exercisesPerGroup}
                        onChange={(e) => setExercisesPerGroup(Number(e.target.value))}
                        className="w-full mt-2 h-6"
                      />
                    </div>

                    <Button
                      onClick={generateWorkout}
                      className="w-full h-10"
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

          {/* Workout Editor */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      My Workout
                      {generatedWorkout.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {generatedWorkout.length} exercises
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {generatedWorkout.length > 0
                        ? "Drag to reorder, edit sets & reps, and manage your workout"
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
                          className="h-9"
                        >
                          <span className="hidden sm:inline">Clear All</span>
                          <span className="sm:hidden">Clear</span>
                        </Button>
                        <Button onClick={startWorkout} size="sm" className="h-9">
                          <Play className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Start Workout</span>
                          <span className="sm:hidden">Start</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {generatedWorkout.length > 0 ? (
                  <div className="space-y-4 max-h-[60vh] sm:max-h-[70vh] lg:max-h-[80vh] overflow-y-auto">
                    {generatedWorkout.map((exercise, index) => (
                      <div
                        key={`${exercise.id}-${index}`}
                        className={`p-4 sm:p-6 border rounded-lg transition-all duration-200 ${draggedIndex === index
                          ? 'opacity-50 scale-95'
                          : dragOverIndex === index
                            ? 'bg-primary/5 border-primary/30 scale-102'
                            : 'bg-muted/20 hover:bg-muted/30'
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Drag Handle */}
                          <div className="flex flex-col items-center pt-1 shrink-0">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                            <div className="text-xs text-muted-foreground mt-1 font-mono">
                              #{index + 1}
                            </div>
                          </div>

                          {/* Exercise Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              <div className="flex-1 pr-2 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3
                                    className="text-base sm:text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => openExerciseModal(exercise)}
                                  >
                                    {exercise.name}
                                  </h3>
                                  <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
                                    {exercise.muscleGroup}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm shrink-0">
                                    {exercise.equipment === "dumbbells" ? (
                                      <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />
                                    ) : (
                                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                                    )}
                                    <span className="hidden sm:inline">{exercise.equipment}</span>
                                  </Badge>
                                  {exercise.youtubeUrl && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 text-xs sm:text-sm shrink-0">
                                      📹<span className="hidden sm:inline ml-1">Video</span>
                                    </Badge>
                                  )}
                                </div>
                                {exercise.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                                    {exercise.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Controls Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <Label className="text-sm sm:text-base font-medium min-w-[35px] sm:min-w-[40px]">Sets:</Label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(index, "sets", Number(e.target.value))}
                                    className="w-16 sm:w-20 px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                  />
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <Label className="text-sm sm:text-base font-medium min-w-[35px] sm:min-w-[40px]">Reps:</Label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={exercise.reps}
                                    onChange={(e) => updateExercise(index, "reps", Number(e.target.value))}
                                    className="w-16 sm:w-20 px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                  />
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                  Total: {exercise.sets} × {exercise.reps} = {exercise.sets * exercise.reps} reps
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 self-start sm:self-auto">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveExerciseUp(index)}
                                  disabled={index === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveExerciseDown(index)}
                                  disabled={index === generatedWorkout.length - 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExercise(index)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 ml-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Mobile total display */}
                            <div className="text-xs text-muted-foreground mt-2 sm:hidden">
                              Total: {exercise.sets} × {exercise.reps} = {exercise.sets * exercise.reps} reps
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16 text-muted-foreground">
                    <Dumbbell className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4 sm:mb-6 opacity-50" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">No exercises in workout</h3>
                    <p className="text-sm sm:text-base max-w-md mx-auto px-4">
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
