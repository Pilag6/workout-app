"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dumbbell, User, Video, ExternalLink } from "lucide-react"

interface Exercise {
  id: string
  name: string
  muscleGroup: string
  equipment: "dumbbells" | "bodyweight"
  description?: string
  youtubeUrl?: string
}

interface IExerciseModalProps {
  exercise: Exercise | null
  isOpen: boolean
  onClose: () => void
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return ""
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : url
}

const ExerciseModal = ({ exercise, isOpen, onClose }: IExerciseModalProps) => {
  if (!exercise) return null

  const openYouTube = () => {
    if (exercise.youtubeUrl) window.open(exercise.youtubeUrl, "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">{exercise.name}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="brand" className="capitalize">
              {exercise.muscleGroup}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {exercise.equipment === "dumbbells" ? (
                <Dumbbell className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              {exercise.equipment}
            </Badge>
          </div>
          {exercise.description ? (
            <DialogDescription className="pt-2 text-sm leading-relaxed text-muted-foreground">
              {exercise.description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-4">
          {exercise.youtubeUrl ? (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="aspect-video w-full bg-secondary">
                <iframe
                  src={getYouTubeEmbedUrl(exercise.youtubeUrl)}
                  title={`${exercise.name} demonstration`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-3">
                <Button variant="outline" className="w-full" onClick={openYouTube}>
                  <ExternalLink className="h-4 w-4" />
                  Watch on YouTube
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Video className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">No demonstration yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a YouTube link to this exercise from the library.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExerciseModal
