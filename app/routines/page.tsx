"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/empty-state"
import { PageContainer } from "@/components/page-container"
import { RoutineNameDialog } from "@/components/routine-name-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  createSavedRoutine,
  getExercises,
  getSavedRoutines,
  saveSavedRoutines,
  setCurrentWorkout,
  upsertSavedRoutine,
  type Exercise,
  type SavedRoutine,
  type WorkoutExercise,
} from "@/lib/workout-store"
import { ChevronDown, ChevronUp, Clock, Copy, Dumbbell, Pencil, Play, Plus, Search, Trash2, X } from "lucide-react"

const estimateMinutes = (exercises: WorkoutExercise[]) =>
  Math.max(1, Math.round(exercises.reduce((sum, ex) => sum + ex.sets * (ex.reps * 3 + 60), 0) / 60))

const routinePreview = (routine: SavedRoutine) => routine.exercises.slice(0, 4).map((ex) => ex.name).join(", ")

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([])
  const [library, setLibrary] = useState<Exercise[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SavedRoutine | null>(null)
  const [routineToRename, setRoutineToRename] = useState<SavedRoutine | null>(null)
  const [routineToDelete, setRoutineToDelete] = useState<SavedRoutine | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setRoutines(getSavedRoutines())
    setLibrary(getExercises())
  }, [])

  const filteredLibrary = useMemo(
    () => library.filter((exercise) => exercise.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [library, searchTerm],
  )

  const persistRoutines = (next: SavedRoutine[]) => {
    setRoutines(next)
    saveSavedRoutines(next)
  }

  const startRoutine = (routine: SavedRoutine) => {
    setCurrentWorkout(routine.exercises)
    router.push("/routine")
  }

  const renameRoutine = (name: string) => {
    if (!routineToRename) return
    const next = { ...routineToRename, name, updatedAt: new Date().toISOString() }
    persistRoutines(routines.map((item) => (item.id === routineToRename.id ? next : item)))
    if (draft?.id === routineToRename.id) {
      setDraft({ ...draft, name, updatedAt: next.updatedAt })
    }
    setRoutineToRename(null)
  }

  const duplicateRoutine = (routine: SavedRoutine) => {
    const copy = createSavedRoutine(`${routine.name} copy`, routine.exercises)
    persistRoutines([...routines, copy])
    toast({ title: "Routine duplicated", description: `${copy.name} was created` })
  }

  const deleteRoutine = () => {
    if (!routineToDelete) return
    persistRoutines(routines.filter((item) => item.id !== routineToDelete.id))
    if (editingId === routineToDelete.id) {
      setEditingId(null)
      setDraft(null)
    }
    setRoutineToDelete(null)
  }

  const startEditing = (routine: SavedRoutine) => {
    setEditingId(routine.id)
    setDraft({ ...routine, exercises: routine.exercises.map((exercise) => ({ ...exercise })) })
  }

  const saveDraft = () => {
    if (!draft) return
    const next = { ...draft, updatedAt: new Date().toISOString() }
    upsertSavedRoutine(next)
    setRoutines(getSavedRoutines())
    setEditingId(null)
    setDraft(null)
    toast({ title: "Routine updated", description: `${next.name} was saved` })
  }

  const updateDraftExercise = (index: number, field: "sets" | "reps", value: number) => {
    if (!draft) return
    const exercises = [...draft.exercises]
    exercises[index] = { ...exercises[index], [field]: Math.max(1, value) }
    setDraft({ ...draft, exercises })
  }

  const moveDraftExercise = (index: number, direction: -1 | 1) => {
    if (!draft) return
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= draft.exercises.length) return
    const exercises = [...draft.exercises]
    ;[exercises[index], exercises[nextIndex]] = [exercises[nextIndex], exercises[index]]
    setDraft({ ...draft, exercises })
  }

  const addDraftExercise = (exercise: Exercise) => {
    if (!draft) return
    const added: WorkoutExercise = { ...exercise, sets: 3, reps: 12 }
    setDraft({ ...draft, exercises: [...draft.exercises, added] })
  }

  const removeDraftExercise = (index: number) => {
    if (!draft) return
    setDraft({ ...draft, exercises: draft.exercises.filter((_, i) => i !== index) })
  }

  return (
    <PageContainer size="wide">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">My routines</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Saved routines</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start, edit, duplicate, or reuse your favorite workouts.</p>
        </div>
      </div>

      {routines.length === 0 ? (
        <EmptyState icon={<Dumbbell />} title="No saved routines" description="Save a routine from Build routine or from a workout summary." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {routines.map((routine) => (
            <section key={routine.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-xl font-semibold tracking-tight">{routine.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{routinePreview(routine) || "No exercises"}</p>
                </div>
                {routine.difficulty ? <Badge variant="brand">{routine.difficulty}</Badge> : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Meta label="Exercises" value={`${routine.exercises.length}`} />
                <Meta label="Minutes" value={`~${estimateMinutes(routine.exercises)}`} />
                <Meta
                  label="Last done"
                  value={routine.lastCompletedAt ? new Date(routine.lastCompletedAt).toLocaleDateString() : "Never"}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="brand" size="sm" onClick={() => startRoutine(routine)}>
                  <Play className="h-4 w-4" />
                  Start
                </Button>
                <Button variant="outline" size="sm" onClick={() => startEditing(routine)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => duplicateRoutine(routine)}>
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRoutineToRename(routine)}>
                  Rename
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRoutineToDelete(routine)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>

              {editingId === routine.id && draft ? (
                <div className="mt-5 rounded-xl border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-display text-base font-semibold">Edit routine</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button variant="brand" size="sm" onClick={saveDraft}>Save</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {draft.exercises.map((exercise, index) => (
                      <div key={`${exercise.id}-${index}`} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{exercise.name}</p>
                            <p className="text-xs capitalize text-muted-foreground">{exercise.muscleGroup} · {exercise.equipment}</p>
                          </div>
                          <div className="flex shrink-0 items-center">
                            <Button variant="ghost" size="icon-sm" onClick={() => moveDraftExercise(index, -1)} disabled={index === 0} aria-label="Move up">
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => moveDraftExercise(index, 1)} disabled={index === draft.exercises.length - 1} aria-label="Move down">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => removeDraftExercise(index)} aria-label="Remove">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <NumberField label="Sets" value={exercise.sets} onChange={(value) => updateDraftExercise(index, "sets", value)} />
                          <NumberField label="Reps" value={exercise.reps} onChange={(value) => updateDraftExercise(index, "reps", value)} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search exercises to add" className="pl-9" />
                    </div>
                    <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                      {filteredLibrary.slice(0, 20).map((exercise) => (
                        <div key={exercise.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{exercise.name}</p>
                            <p className="text-xs capitalize text-muted-foreground">{exercise.muscleGroup} · {exercise.equipment}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => addDraftExercise(exercise)}>
                            <Plus className="h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
      <RoutineNameDialog
        open={Boolean(routineToRename)}
        onOpenChange={(open) => {
          if (!open) setRoutineToRename(null)
        }}
        title="Rename routine"
        description="Choose a clear name so this routine is easy to find later."
        initialName={routineToRename?.name ?? ""}
        submitLabel="Save name"
        onSubmit={renameRoutine}
      />

      <AlertDialog
        open={Boolean(routineToDelete)}
        onOpenChange={(open) => {
          if (!open) setRoutineToDelete(null)
        }}
      >
        <AlertDialogContent className="border-destructive/20 bg-card shadow-2xl sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl tracking-tight">Delete routine?</AlertDialogTitle>
            <AlertDialogDescription>
              {routineToDelete
                ? `${routineToDelete.name} will be removed from My Routines. This cannot be undone.`
                : "This routine will be removed from My Routines. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteRoutine} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete routine
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-background p-3">
    <div className="font-display text-lg font-semibold tabular-nums leading-none">{value}</div>
    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
      {label === "Minutes" ? <Clock className="h-3 w-3" /> : null}
      {label}
    </div>
  </div>
)

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
    {label}
    <Input type="number" min={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-8 w-20" />
  </label>
)
