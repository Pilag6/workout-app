"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageContainer } from "@/components/page-container"
import { EmptyState } from "@/components/empty-state"
import ExerciseModal from "@/components/ExerciseModal"
import { RoutineNameDialog } from "@/components/routine-name-dialog"
import {
  ArrowLeft,
  Shuffle,
  Play,
  Dumbbell,
  User,
  Upload,
  Search,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Minus,
  Clock,
  Layers,
  Video,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  getExercises,
  getSettings,
  createSavedRoutine,
  setCurrentWorkout,
  upsertSavedRoutine,
  MUSCLE_GROUPS,
  type Exercise,
  type WorkoutExercise,
} from "@/lib/workout-store"

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

export default function WorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutExercise[]>([])
  const [exercisesPerGroup, setExercisesPerGroup] = useState(3)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>("all")
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>("all")

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const [defaults, setDefaults] = useState({ sets: 3, reps: 12, restSeconds: 60 })

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setExercises(getExercises())
    const settings = getSettings()
    setDefaults({
      sets: settings.defaultSets,
      reps: settings.defaultReps,
      restSeconds: settings.restSeconds,
    })
    setExercisesPerGroup(3)
  }, [])

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMuscle = selectedMuscleFilter === "all" || exercise.muscleGroup === selectedMuscleFilter
      const matchesEquipment =
        selectedEquipmentFilter === "all" || exercise.equipment === selectedEquipmentFilter
      return matchesSearch && matchesMuscle && matchesEquipment
    })
  }, [exercises, searchTerm, selectedMuscleFilter, selectedEquipmentFilter])

  const routineStats = useMemo(() => {
    const totalSets = generatedWorkout.reduce((sum, ex) => sum + ex.sets, 0)
    const muscles = Array.from(new Set(generatedWorkout.map((ex) => ex.muscleGroup)))
    const estSeconds = generatedWorkout.reduce(
      (sum, ex) => sum + ex.sets * (ex.reps * 3 + defaults.restSeconds),
      0,
    )
    return {
      totalSets,
      muscles,
      estMinutes: Math.max(1, Math.round(estSeconds / 60)),
    }
  }, [generatedWorkout, defaults.restSeconds])

  const toggleMuscleGroup = (group: string) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    )
  }

  const addExerciseToWorkout = (exercise: Exercise) => {
    if (generatedWorkout.some((ex) => ex.id === exercise.id)) {
      toast({
        title: "Already in routine",
        description: `${exercise.name} is already in your routine`,
        variant: "destructive",
      })
      return
    }
    setGeneratedWorkout((prev) => [...prev, { ...exercise, sets: defaults.sets, reps: defaults.reps }])
    toast({ title: "Added", description: `${exercise.name} added to your routine` })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", "")
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
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
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const moveExerciseUp = (index: number) => {
    if (index === 0) return
    const newWorkout = [...generatedWorkout]
    ;[newWorkout[index - 1], newWorkout[index]] = [newWorkout[index], newWorkout[index - 1]]
    setGeneratedWorkout(newWorkout)
  }

  const moveExerciseDown = (index: number) => {
    if (index === generatedWorkout.length - 1) return
    const newWorkout = [...generatedWorkout]
    ;[newWorkout[index + 1], newWorkout[index]] = [newWorkout[index], newWorkout[index + 1]]
    setGeneratedWorkout(newWorkout)
  }

  const handleWorkoutUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        const source = data && data.exercises && Array.isArray(data.exercises) ? data.exercises : data
        if (!Array.isArray(source)) {
          toast({
            title: "Import failed",
            description: "Invalid file format — expected a workout with an exercises array",
            variant: "destructive",
          })
          return
        }
        const valid = source
          .filter(
            (ex: any) =>
              ex.name &&
              ex.muscleGroup &&
              ex.equipment &&
              typeof ex.sets === "number" &&
              typeof ex.reps === "number",
          )
          .map((ex: any) => ({
            ...ex,
            id: ex.id || Date.now().toString() + Math.random().toString(36).slice(2, 11),
          }))
        if (valid.length > 0) {
          setGeneratedWorkout(valid)
          toast({
            title: "Routine imported",
            description: `Imported ${valid.length} exercises`,
          })
        } else {
          toast({
            title: "Import failed",
            description: "No valid exercises found in file",
            variant: "destructive",
          })
        }
      } catch {
        toast({ title: "Import failed", description: "Invalid JSON file", variant: "destructive" })
      }
    }
    reader.readAsText(file)
  }

  const generateWorkout = () => {
    if (selectedMuscleGroups.length === 0) {
      toast({
        title: "Select a focus",
        description: "Choose at least one muscle group",
        variant: "destructive",
      })
      return
    }
    const workout: WorkoutExercise[] = []
    selectedMuscleGroups.forEach((group) => {
      const groupExercises = exercises.filter((ex) => ex.muscleGroup === group)
      const available = groupExercises.filter(
        (ex) => !generatedWorkout.some((w) => w.id === ex.id),
      )
      const shuffled = [...available].sort(() => Math.random() - 0.5)
      shuffled.slice(0, Math.min(exercisesPerGroup, available.length)).forEach((exercise) => {
        workout.push({ ...exercise, sets: defaults.sets, reps: defaults.reps })
      })
    })
    const combined = [...generatedWorkout, ...workout].sort(() => Math.random() - 0.5)
    setGeneratedWorkout(combined)
    toast({ title: "Routine generated", description: `${combined.length} exercises ready` })
  }

  const startWorkout = () => {
    if (generatedWorkout.length === 0) {
      toast({
        title: "Empty routine",
        description: "Add exercises before starting",
        variant: "destructive",
      })
      return
    }
    setCurrentWorkout(generatedWorkout)
    router.push("/routine")
  }

  const saveRoutine = () => {
    if (generatedWorkout.length === 0) {
      toast({ title: "Empty routine", description: "Add exercises before saving", variant: "destructive" })
      return
    }
    setSaveDialogOpen(true)
  }

  const confirmSaveRoutine = (name: string) => {
    upsertSavedRoutine(createSavedRoutine(name, generatedWorkout))
    toast({ title: "Routine saved", description: `${name} is available in My Routines` })
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
    toast({ title: "Routine cleared", description: "All exercises removed" })
  }

  const openExerciseModal = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setIsModalOpen(true)
  }

  const closeExerciseModal = () => {
    setSelectedExercise(null)
    setIsModalOpen(false)
  }

  const hasActiveFilters =
    searchTerm !== "" || selectedMuscleFilter !== "all" || selectedEquipmentFilter !== "all"

  return (
    <PageContainer size="wide">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-3 h-8 text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Build routine</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assemble your session, then run it set by set.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Exercise picker */}
        <div className="lg:col-span-5">
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="generate">Auto-generate</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-4 space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search exercises"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 pl-9"
                  aria-label="Search exercises"
                />
              </div>

              <div className="space-y-3">
                <SegmentedFilter
                  label="Equipment"
                  value={selectedEquipmentFilter}
                  onChange={setSelectedEquipmentFilter}
                  options={[
                    { value: "all", label: "All" },
                    { value: "dumbbells", label: "Dumbbells" },
                    { value: "bodyweight", label: "Bodyweight" },
                  ]}
                />
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip
                    active={selectedMuscleFilter === "all"}
                    onClick={() => setSelectedMuscleFilter("all")}
                  >
                    All muscles
                  </FilterChip>
                  {MUSCLE_GROUPS.map((group) => (
                    <FilterChip
                      key={group}
                      active={selectedMuscleFilter === group}
                      onClick={() => setSelectedMuscleFilter(group)}
                    >
                      {capitalize(group)}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs text-muted-foreground">
                  {filteredExercises.length} exercise{filteredExercises.length === 1 ? "" : "s"}
                </span>
                {hasActiveFilters ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedMuscleFilter("all")
                      setSelectedEquipmentFilter("all")
                    }}
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </Button>
                ) : null}
              </div>

              <div className="scroll-area max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                {filteredExercises.map((exercise) => {
                  const inWorkout = generatedWorkout.some((ex) => ex.id === exercise.id)
                  return (
                    <div
                      key={exercise.id}
                      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-muted-foreground/30"
                    >
                      <button
                        type="button"
                        onClick={() => openExerciseModal(exercise)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium">{exercise.name}</span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{exercise.muscleGroup}</span>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1">
                            {exercise.equipment === "dumbbells" ? (
                              <Dumbbell className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {exercise.equipment}
                          </span>
                          {exercise.youtubeUrl ? <Video className="h-3 w-3" /> : null}
                        </span>
                      </button>
                      <Button
                        size="icon-sm"
                        variant={inWorkout ? "secondary" : "outline"}
                        onClick={() => addExerciseToWorkout(exercise)}
                        disabled={inWorkout}
                        aria-label={inWorkout ? "Already added" : `Add ${exercise.name}`}
                      >
                        {inWorkout ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  )
                })}

                {filteredExercises.length === 0 ? (
                  <EmptyState
                    icon={<Search />}
                    title="No matches"
                    description="Try a different search or clear your filters."
                  />
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="generate" className="mt-4 space-y-5">
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="font-display text-base font-semibold tracking-tight">Auto-generate</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a focus and we'll assemble a balanced routine.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MUSCLE_GROUPS.map((group) => (
                    <label
                      key={group}
                      htmlFor={`gen-${group}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-muted-foreground/30 has-[:checked]:border-brand/50 has-[:checked]:bg-brand/10"
                    >
                      <Checkbox
                        id={`gen-${group}`}
                        checked={selectedMuscleGroups.includes(group)}
                        onCheckedChange={() => toggleMuscleGroup(group)}
                      />
                      {capitalize(group)}
                    </label>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm">Exercises per group</Label>
                    <span className="font-display text-sm font-semibold tabular-nums">
                      {exercisesPerGroup}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={exercisesPerGroup}
                    onChange={(e) => setExercisesPerGroup(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-brand"
                    aria-label="Exercises per group"
                  />
                </div>

                <Button
                  onClick={generateWorkout}
                  className="mt-5 w-full"
                  variant="brand"
                  disabled={selectedMuscleGroups.length === 0}
                >
                  <Shuffle className="h-4 w-4" />
                  Generate routine
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-display text-base font-semibold tracking-tight">Import a routine</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Load a previously exported JSON file.</p>
                <Input type="file" accept=".json" onChange={handleWorkoutUpload} className="mt-3" />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Routine builder */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-border bg-card shadow-soft">
            <div className="border-b border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold tracking-tight">Your routine</h2>
                {generatedWorkout.length > 0 ? (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearWorkout}>
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                ) : null}
              </div>

              {generatedWorkout.length > 0 ? (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <RoutineMeta icon={<Layers className="h-4 w-4" />} value={`${generatedWorkout.length}`} label="Exercises" />
                  <RoutineMeta icon={<Dumbbell className="h-4 w-4" />} value={`${routineStats.totalSets}`} label="Total sets" />
                  <RoutineMeta icon={<Clock className="h-4 w-4" />} value={`~${routineStats.estMinutes}`} label="Minutes" />
                </div>
              ) : null}

              {routineStats.muscles.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {routineStats.muscles.map((m) => (
                    <Badge key={m} variant="brand" className="capitalize">
                      {m}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="p-4 sm:p-5">
              {generatedWorkout.length > 0 ? (
                <div className="scroll-area max-h-[62vh] space-y-2.5 overflow-y-auto pr-1">
                  {generatedWorkout.map((exercise, index) => (
                    <div
                      key={`${exercise.id}-${index}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-xl border p-3.5 transition-all sm:p-4 ${
                        draggedIndex === index
                          ? "opacity-50"
                          : dragOverIndex === index && draggedIndex !== null
                            ? "border-brand/50 bg-brand/5"
                            : "border-border bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                          <span className="font-display text-xs font-semibold tabular-nums text-muted-foreground">
                            {index + 1}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => openExerciseModal(exercise)}
                              className="min-w-0 text-left"
                            >
                              <span className="block truncate text-sm font-medium">{exercise.name}</span>
                              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="capitalize">{exercise.muscleGroup}</span>
                                <span aria-hidden>·</span>
                                <span className="capitalize">{exercise.equipment}</span>
                              </span>
                            </button>
                            <div className="flex shrink-0 items-center">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => moveExerciseUp(index)}
                                disabled={index === 0}
                                aria-label="Move up"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => moveExerciseDown(index)}
                                disabled={index === generatedWorkout.length - 1}
                                aria-label="Move down"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => removeExercise(index)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Remove"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4">
                            <Stepper
                              label="Sets"
                              value={exercise.sets}
                              min={1}
                              max={10}
                              onChange={(v) => updateExercise(index, "sets", v)}
                            />
                            <Stepper
                              label="Reps"
                              value={exercise.reps}
                              min={1}
                              max={50}
                              onChange={(v) => updateExercise(index, "reps", v)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {exercise.sets * exercise.reps} total reps
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Dumbbell />}
                  title="Your routine is empty"
                  description="Browse the library or auto-generate a session to get started."
                />
              )}
            </div>

            {generatedWorkout.length > 0 ? (
              <div className="sticky bottom-0 rounded-b-2xl border-t border-border bg-card/95 p-4 backdrop-blur sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={saveRoutine} variant="outline" size="lg" className="sm:w-44">
                    Save routine
                  </Button>
                  <Button onClick={startWorkout} variant="brand" size="lg" className="flex-1">
                    <Play className="h-4 w-4" />
                    Start workout
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ExerciseModal exercise={selectedExercise} isOpen={isModalOpen} onClose={closeExerciseModal} />
      <RoutineNameDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        title="Save this routine"
        description="Give this workout a name so you can start it again from My Routines."
        initialName={`Routine ${new Date().toLocaleDateString()}`}
        submitLabel="Save routine"
        onSubmit={confirmSaveRoutine}
      />
    </PageContainer>
  )
}

const SegmentedFilter = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) => (
  <div className="flex items-center gap-3">
    <span className="sr-only">{label}</span>
    <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === option.value
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
)

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-brand/50 bg-brand/10 text-brand"
        : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
    }`}
  >
    {children}
  </button>
)

const Stepper = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) => (
  <div className="flex items-center gap-2">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
    <div className="inline-flex items-center rounded-lg border border-border">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        aria-label={`Decrease ${label}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center font-display text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        aria-label={`Increase ${label}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
)

const RoutineMeta = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) => (
  <div className="rounded-lg border border-border bg-background p-3">
    <div className="mb-1 text-muted-foreground">{icon}</div>
    <div className="font-display text-lg font-semibold tabular-nums leading-none">{value}</div>
    <div className="mt-1 text-xs text-muted-foreground">{label}</div>
  </div>
)
