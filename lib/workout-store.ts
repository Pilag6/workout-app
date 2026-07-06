/**
 * Centralized client-side data layer.
 *
 * This app persists everything in localStorage. Rather than scattering
 * `localStorage.getItem(...)` calls across screens, all reads/writes and
 * derived metrics live here so the dashboard, progress and session
 * screens share one consistent source of truth.
 */

import sampleExercisesData from "@/data/sampleExercises.json"

export type Equipment = "dumbbells" | "bodyweight"

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  equipment: Equipment
  description?: string
  youtubeUrl?: string
}

export interface WorkoutExercise extends Exercise {
  sets: number
  reps: number
}

export interface CompletedExercise extends WorkoutExercise {
  completedSets: number
  isCompleted: boolean
}

export interface WorkoutSummary {
  date: string
  exercises: number
  completedExercises: number
  totalSets: number
  duration: number
  workout: CompletedExercise[]
}

export interface WorkoutSettings {
  restSeconds: number
  defaultSets: number
  defaultReps: number
  weeklyGoal: number
  unit: "kg" | "lb"
}

export const STORAGE_KEYS = {
  exercises: "workout-exercises",
  current: "current-workout",
  history: "workout-history",
  summary: "workout-summary",
  settings: "workout-settings",
} as const

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "abs",
] as const

export const DEFAULT_SETTINGS: WorkoutSettings = {
  restSeconds: 60,
  defaultSets: 3,
  defaultReps: 12,
  weeklyGoal: 4,
  unit: "kg",
}

const isBrowser = () => typeof window !== "undefined"

const read = <T,>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const write = (key: string, value: unknown) => {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const isValidExercise = (value: unknown): value is Exercise =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Exercise).id === "string" &&
  typeof (value as Exercise).name === "string" &&
  typeof (value as Exercise).muscleGroup === "string" &&
  ((value as Exercise).equipment === "dumbbells" ||
    (value as Exercise).equipment === "bodyweight")

/** Map bundled sample JSON into the app's Exercise shape. */
export const mapSampleExercises = (): Exercise[] =>
  (sampleExercisesData as Array<Record<string, unknown>>).map((exercise) => ({
    id: String(exercise.id),
    name: String(exercise.name),
    muscleGroup: String(exercise.muscleGroup),
    equipment: exercise.equipment as Equipment,
    description: exercise.description ? String(exercise.description) : undefined,
    youtubeUrl: exercise.youtubeUrl ? String(exercise.youtubeUrl) : undefined,
  }))

/** Overwrite localStorage with the bundled default library (86 exercises). */
export const resetExercisesToDefaults = (): Exercise[] => {
  const seeded = mapSampleExercises()
  saveExercises(seeded)
  return seeded
}

/**
 * Ensure the exercise library exists in localStorage.
 *
 * The app does NOT read sampleExercises.json on every render — it seeds
 * localStorage once when empty or corrupt. Call this (via getExercises) on
 * any screen that needs the library so /workout works even if the user
 * never visited Home or Library first.
 */
const ensureExercisesInitialized = (): Exercise[] => {
  const stored = read<unknown>(STORAGE_KEYS.exercises, null)

  if (Array.isArray(stored) && stored.length > 0 && stored.every(isValidExercise)) {
    return stored
  }

  return resetExercisesToDefaults()
}

export const getExercises = (): Exercise[] => ensureExercisesInitialized()
export const saveExercises = (exercises: Exercise[]) => write(STORAGE_KEYS.exercises, exercises)

export const getCurrentWorkout = (): WorkoutExercise[] =>
  read<WorkoutExercise[]>(STORAGE_KEYS.current, [])
export const setCurrentWorkout = (workout: WorkoutExercise[]) =>
  write(STORAGE_KEYS.current, workout)
export const clearCurrentWorkout = () => {
  if (isBrowser()) window.localStorage.removeItem(STORAGE_KEYS.current)
}

export const getHistory = (): WorkoutSummary[] =>
  read<WorkoutSummary[]>(STORAGE_KEYS.history, [])
export const appendHistory = (summary: WorkoutSummary) => {
  const history = getHistory()
  history.push(summary)
  write(STORAGE_KEYS.history, history)
}

export const getLastSummary = (): WorkoutSummary | null =>
  read<WorkoutSummary | null>(STORAGE_KEYS.summary, null)
export const setLastSummary = (summary: WorkoutSummary) => write(STORAGE_KEYS.summary, summary)

export const getSettings = (): WorkoutSettings => ({
  ...DEFAULT_SETTINGS,
  ...read<Partial<WorkoutSettings>>(STORAGE_KEYS.settings, {}),
})
export const saveSettings = (settings: WorkoutSettings) => write(STORAGE_KEYS.settings, settings)

/* ---------------------------------------------------------------- */
/* Derived metrics                                                   */
/* ---------------------------------------------------------------- */

export interface DashboardStats {
  totalWorkouts: number
  streak: number
  thisWeek: number
  weeklyGoal: number
  totalMinutes: number
  totalVolume: number
  avgCompletion: number
  lastWorkout: WorkoutSummary | null
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

const dayKey = (d: Date) => startOfDay(d).getTime()

const volumeOf = (summary: WorkoutSummary): number =>
  summary.workout.reduce((sum, ex) => sum + ex.completedSets * ex.reps, 0)

/** Number of consecutive calendar days (ending today or yesterday) with a session. */
const computeStreak = (history: WorkoutSummary[]): number => {
  if (history.length === 0) return 0
  const days = new Set(history.map((h) => dayKey(new Date(h.date))))
  const today = startOfDay(new Date())
  let streak = 0
  const cursor = new Date(today)

  // Allow the streak to still count if the last session was yesterday.
  if (!days.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 1)
  if (!days.has(cursor.getTime())) return 0

  while (days.has(cursor.getTime())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Monday-based start of the ISO week for a given date. */
export const startOfWeek = (date: Date): Date => {
  const d = startOfDay(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d
}

export const getDashboardStats = (weeklyGoal = DEFAULT_SETTINGS.weeklyGoal): DashboardStats => {
  const history = getHistory()
  const weekStart = startOfWeek(new Date()).getTime()

  const thisWeek = history.filter((h) => new Date(h.date).getTime() >= weekStart).length
  const totalMinutes = history.reduce((sum, h) => sum + (h.duration || 0), 0)
  const totalVolume = history.reduce((sum, h) => sum + volumeOf(h), 0)
  const avgCompletion =
    history.length > 0
      ? Math.round(
          history.reduce(
            (sum, h) => sum + (h.exercises > 0 ? (h.completedExercises / h.exercises) * 100 : 0),
            0,
          ) / history.length,
        )
      : 0

  return {
    totalWorkouts: history.length,
    streak: computeStreak(history),
    thisWeek,
    weeklyGoal,
    totalMinutes,
    totalVolume,
    avgCompletion,
    lastWorkout: history.length > 0 ? history[history.length - 1] : null,
  }
}

export interface WeeklyPoint {
  label: string
  volume: number
  workouts: number
  minutes: number
}

/** Aggregates the last `weeks` weeks of activity for trend charts. */
export const getWeeklySeries = (weeks = 8): WeeklyPoint[] => {
  const history = getHistory()
  const thisWeekStart = startOfWeek(new Date())
  const points: WeeklyPoint[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeekStart)
    start.setDate(start.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    const inWeek = history.filter((h) => {
      const t = new Date(h.date).getTime()
      return t >= start.getTime() && t < end.getTime()
    })

    points.push({
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      volume: inWeek.reduce((sum, h) => sum + volumeOf(h), 0),
      workouts: inWeek.length,
      minutes: inWeek.reduce((sum, h) => sum + (h.duration || 0), 0),
    })
  }
  return points
}

export interface MuscleDistribution {
  muscleGroup: string
  count: number
}

export const getMuscleDistribution = (): MuscleDistribution[] => {
  const history = getHistory()
  const counts = new Map<string, number>()
  history.forEach((h) =>
    h.workout.forEach((ex) => {
      if (ex.isCompleted) counts.set(ex.muscleGroup, (counts.get(ex.muscleGroup) || 0) + 1)
    }),
  )
  return Array.from(counts.entries())
    .map(([muscleGroup, count]) => ({ muscleGroup, count }))
    .sort((a, b) => b.count - a.count)
}
