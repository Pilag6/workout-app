"use client"

import { FormEvent, useEffect, useId, useState } from "react"
import { Dumbbell } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RoutineNameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  initialName: string
  submitLabel: string
  onSubmit: (name: string) => void
}

export function RoutineNameDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName,
  submitLabel,
  onSubmit,
}: RoutineNameDialogProps) {
  const inputId = useId()
  const [name, setName] = useState(initialName)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError("")
    }
  }, [initialName, open])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()

    if (!trimmed) {
      setError("Enter a routine name to continue.")
      return
    }

    onSubmit(trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-brand/20 bg-card p-0 shadow-2xl sm:max-w-md sm:rounded-2xl">
        <div className="border-b border-border bg-gradient-to-br from-brand/15 via-card to-card p-6 pb-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand shadow-soft">
            <Dumbbell className="h-5 w-5" />
          </div>
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-display text-2xl tracking-tight">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 pt-5">
          <div className="space-y-2">
            <Label htmlFor={inputId}>Routine name</Label>
            <Input
              id={inputId}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (error) setError("")
              }}
              placeholder="Push day"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? `${inputId}-error` : undefined}
              autoFocus
              className="h-12 text-base"
            />
            {error ? (
              <p id={`${inputId}-error`} className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
