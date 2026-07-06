"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Upload,
  Download,
  Plus,
  Trash2,
  Dumbbell,
  User,
  Search,
  Video,
  Pencil,
  RotateCcw,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageContainer } from "@/components/page-container"
import { EmptyState } from "@/components/empty-state"
import ExerciseModal from "@/components/ExerciseModal"
import { useToast } from "@/hooks/use-toast"
import {
  getExercises,
  saveExercises,
  resetExercisesToDefaults,
  MUSCLE_GROUPS,
  type Exercise,
  type Equipment,
} from "@/lib/workout-store"

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const emptyForm: Partial<Exercise> = {}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [muscleFilter, setMuscleFilter] = useState<string>("all")
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all")

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Partial<Exercise>>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    setExercises(getExercises())
  }, [])

  const persist = (next: Exercise[]) => {
    setExercises(next)
    saveExercises(next)
  }

  const filtered = useMemo(
    () =>
      exercises.filter((ex) => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesMuscle = muscleFilter === "all" || ex.muscleGroup === muscleFilter
        const matchesEquipment = equipmentFilter === "all" || ex.equipment === equipmentFilter
        return matchesSearch && matchesMuscle && matchesEquipment
      }),
    [exercises, searchTerm, muscleFilter, equipmentFilter],
  )

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (exercise: Exercise) => {
    setEditingId(exercise.id)
    setForm(exercise)
    setFormOpen(true)
  }

  const saveForm = () => {
    if (!form.name || !form.muscleGroup || !form.equipment) {
      toast({
        title: "Missing details",
        description: "Name, muscle group and equipment are required",
        variant: "destructive",
      })
      return
    }
    if (editingId) {
      persist(exercises.map((ex) => (ex.id === editingId ? ({ ...ex, ...form } as Exercise) : ex)))
      toast({ title: "Exercise updated", description: `${form.name} was updated` })
    } else {
      const exercise: Exercise = {
        id: Date.now().toString(),
        name: form.name,
        muscleGroup: form.muscleGroup,
        equipment: form.equipment,
        description: form.description || "",
        youtubeUrl: form.youtubeUrl || undefined,
      }
      persist([...exercises, exercise])
      toast({ title: "Exercise added", description: `${exercise.name} added to your library` })
    }
    setFormOpen(false)
    setForm(emptyForm)
    setEditingId(null)
  }

  const deleteExercise = (id: string) => {
    persist(exercises.filter((ex) => ex.id !== id))
    toast({ title: "Exercise removed" })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (Array.isArray(data)) {
          const valid = data.filter((ex) => ex.name && ex.muscleGroup && ex.equipment)
          persist(valid)
          toast({ title: "Library imported", description: `Imported ${valid.length} exercises` })
        }
      } catch {
        toast({ title: "Import failed", description: "Invalid JSON file", variant: "destructive" })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const exportExercises = () => {
    const dataBlob = new Blob([JSON.stringify(exercises, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "workout-exercises.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetToDefaults = () => {
    setExercises(resetExercisesToDefaults())
    toast({ title: "Library reset", description: "Restored the default exercises" })
  }

  const hasActiveFilters = searchTerm !== "" || muscleFilter !== "all" || equipmentFilter !== "all"

  return (
    <PageContainer size="wide">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Exercise library</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Library</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {exercises.length} exercises for dumbbells and bodyweight training.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input id="file-upload" type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          <Button asChild variant="ghost" size="sm">
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-4 w-4" />
              Import
            </label>
          </Button>
          <Button variant="ghost" size="sm" onClick={exportExercises}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="brand" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add exercise
          </Button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-9"
              aria-label="Search exercises"
            />
          </div>
          <div className="inline-flex shrink-0 rounded-lg border border-border bg-secondary/50 p-0.5">
            {[
              { value: "all", label: "All" },
              { value: "dumbbells", label: "Dumbbells" },
              { value: "bodyweight", label: "Bodyweight" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEquipmentFilter(option.value)}
                aria-pressed={equipmentFilter === option.value}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  equipmentFilter === option.value
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={muscleFilter === "all"} onClick={() => setMuscleFilter("all")}>
            All muscles
          </FilterChip>
          {MUSCLE_GROUPS.map((group) => (
            <FilterChip key={group} active={muscleFilter === group} onClick={() => setMuscleFilter(group)}>
              {capitalize(group)}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between px-0.5">
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {exercises.length}
        </span>
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => {
              setSearchTerm("")
              setMuscleFilter("all")
              setEquipmentFilter("all")
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((exercise) => (
            <div
              key={exercise.id}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-soft transition-colors hover:border-muted-foreground/30"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedExercise(exercise)
                  setIsModalOpen(true)
                }}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{exercise.name}</span>
                  {exercise.youtubeUrl ? <Video className="h-3.5 w-3.5 shrink-0 text-brand" /> : null}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
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
                </div>
              </button>
              <div className="flex shrink-0 items-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(exercise)}
                  aria-label={`Edit ${exercise.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteExercise(exercise.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${exercise.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search />}
          title="No exercises found"
          description="Try a different search, clear filters, or add a new exercise."
          action={
            <Button variant="brand" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add exercise
            </Button>
          }
        />
      )}

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-soft sm:flex-row">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">Ready to train?</h3>
          <p className="text-sm text-muted-foreground">Build a routine from your library and start a session.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetToDefaults} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
            Reset defaults
          </Button>
          <Button asChild variant="brand">
            <Link href="/workout">
              <Play className="h-4 w-4" />
              Build routine
            </Link>
          </Button>
        </div>
      </div>

      {/* Add / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit exercise" : "Add exercise"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the details for this exercise."
                : "Add a custom exercise to your library. Export afterwards to keep a backup."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ex-name">Name</Label>
              <Input
                id="ex-name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Push-ups"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ex-muscle">Muscle group</Label>
                <Select
                  value={form.muscleGroup || ""}
                  onValueChange={(value) => setForm({ ...form, muscleGroup: value })}
                >
                  <SelectTrigger id="ex-muscle" className="mt-1.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {capitalize(group)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ex-equipment">Equipment</Label>
                <Select
                  value={form.equipment || ""}
                  onValueChange={(value: Equipment) => setForm({ ...form, equipment: value })}
                >
                  <SelectTrigger id="ex-equipment" className="mt-1.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bodyweight">Bodyweight</SelectItem>
                    <SelectItem value="dumbbells">Dumbbells</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="ex-desc">Description</Label>
              <Textarea
                id="ex-desc"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief cues or instructions"
                rows={3}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="ex-video">YouTube URL (optional)</Label>
              <Input
                id="ex-video"
                type="url"
                value={form.youtubeUrl || ""}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={saveForm}>
              {editingId ? "Save changes" : "Add exercise"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExerciseModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={() => {
          setSelectedExercise(null)
          setIsModalOpen(false)
        }}
      />
    </PageContainer>
  )
}

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
