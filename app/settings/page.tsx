"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Minus, Plus, Monitor, Moon, Sun, Trash2, Target, Timer, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/page-container"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type WorkoutSettings,
} from "@/lib/workout-store"

export default function SettingsPage() {
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_SETTINGS)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setSettings(getSettings())
    setMounted(true)
  }, [])

  const update = (patch: Partial<WorkoutSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  const resetData = () => {
    window.localStorage.removeItem(STORAGE_KEYS.history)
    window.localStorage.removeItem(STORAGE_KEYS.summary)
    window.localStorage.removeItem(STORAGE_KEYS.current)
    toast({ title: "Progress reset", description: "Your workout history has been cleared" })
  }

  return (
    <PageContainer>
      <div className="mb-8">
        <p className="eyebrow mb-2">Profile & settings</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure your training defaults and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <SettingsSection
          icon={<Target className="h-4 w-4" />}
          title="Goals"
          description="Set the weekly target that drives your dashboard ring."
        >
          <Row label="Weekly workout goal" hint="Sessions per week">
            <Stepper
              value={settings.weeklyGoal}
              min={1}
              max={7}
              onChange={(v) => update({ weeklyGoal: v })}
            />
          </Row>
        </SettingsSection>

        <SettingsSection
          icon={<Timer className="h-4 w-4" />}
          title="Training defaults"
          description="Applied to new exercises and rest timers."
        >
          <Row label="Rest between sets" hint="Seconds">
            <Stepper
              value={settings.restSeconds}
              min={15}
              max={180}
              step={15}
              onChange={(v) => update({ restSeconds: v })}
            />
          </Row>
          <Row label="Default sets">
            <Stepper value={settings.defaultSets} min={1} max={8} onChange={(v) => update({ defaultSets: v })} />
          </Row>
          <Row label="Default reps">
            <Stepper value={settings.defaultReps} min={1} max={30} onChange={(v) => update({ defaultReps: v })} />
          </Row>
        </SettingsSection>

        <SettingsSection
          icon={<Scale className="h-4 w-4" />}
          title="Preferences"
          description="Units and appearance."
        >
          <Row label="Weight unit">
            <Segmented
              value={settings.unit}
              onChange={(v) => update({ unit: v as WorkoutSettings["unit"] })}
              options={[
                { value: "kg", label: "kg" },
                { value: "lb", label: "lb" },
              ]}
            />
          </Row>
          <Row label="Appearance">
            <Segmented
              value={mounted ? theme || "system" : "system"}
              onChange={(v) => setTheme(v)}
              options={[
                { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
                { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
                { value: "system", label: "Auto", icon: <Monitor className="h-3.5 w-3.5" /> },
              ]}
            />
          </Row>
        </SettingsSection>

        <SettingsSection
          icon={<Trash2 className="h-4 w-4" />}
          title="Data"
          description="Manage the data stored on this device."
        >
          <Row label="Reset progress" hint="Clears workout history and any active session">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes your workout history and any session in progress. Your exercise
                    library is not affected. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={resetData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset progress
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Row>
        </SettingsSection>
      </div>
    </PageContainer>
  )
}

const SettingsSection = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) => (
  <section className="rounded-xl border border-border bg-card shadow-soft">
    <div className="border-b border-border p-5">
      <div className="flex items-center gap-2">
        <span className="text-brand">{icon}</span>
        <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="divide-y divide-border">{children}</div>
  </section>
)

const Row = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) => (
  <div className="flex items-center justify-between gap-4 p-5">
    <div className="min-w-0">
      <p className="text-sm font-medium">{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
)

const Stepper = ({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) => (
  <div className="inline-flex items-center rounded-lg border border-border">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - step))}
      disabled={value <= min}
      className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      aria-label="Decrease"
    >
      <Minus className="h-4 w-4" />
    </button>
    <span className="w-12 text-center font-display text-sm font-semibold tabular-nums">{value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + step))}
      disabled={value >= max}
      className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      aria-label="Increase"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
)

const Segmented = ({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; icon?: React.ReactNode }[]
}) => (
  <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        aria-pressed={value === option.value}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          value === option.value
            ? "bg-card text-foreground shadow-soft"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {option.icon}
        {option.label}
      </button>
    ))}
  </div>
)
