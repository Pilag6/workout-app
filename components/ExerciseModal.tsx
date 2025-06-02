'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, User, Play, ExternalLink } from 'lucide-react'

interface Exercise {
    id: string
    name: string
    muscleGroup: string
    equipment: 'dumbbells' | 'bodyweight'
    description?: string
    youtubeUrl?: string
}

interface IExerciseModalProps {
    exercise: Exercise | null
    isOpen: boolean
    onClose: () => void
}

const ExerciseModal = ({ exercise, isOpen, onClose }: IExerciseModalProps) => {
    if (!exercise) return null

    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return ''

        // Handle different YouTube URL formats
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId[1]}`
        }
        return url
    }

    const openYouTubeInNewTab = () => {
        if (exercise.youtubeUrl) {
            window.open(exercise.youtubeUrl, '_blank')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                        {exercise.name}
                        <Badge variant="secondary" className="text-sm">
                            {exercise.muscleGroup}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 text-sm">
                            {exercise.equipment === 'dumbbells' ? (
                                <Dumbbell className="h-4 w-4" />
                            ) : (
                                <User className="h-4 w-4" />
                            )}
                            {exercise.equipment}
                        </Badge>
                    </DialogTitle>
                    {exercise.description && (
                        <DialogDescription className="text-base leading-relaxed">
                            {exercise.description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="space-y-6">
                    {exercise.youtubeUrl && (
                        <Card>
                            <CardContent className="p-0">
                                <div className="aspect-video w-full">
                                    <iframe
                                        src={getYouTubeEmbedUrl(exercise.youtubeUrl)}
                                        title={`${exercise.name} demonstration`}
                                        className="w-full h-full rounded-lg"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                <div className="p-4">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={openYouTubeInNewTab}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Watch on YouTube
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!exercise.youtubeUrl && (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                <Play className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-semibold mb-2">No video available</h3>
                                <p className="text-sm text-muted-foreground">
                                    Video demonstration for this exercise is not available yet.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-4">Exercise Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Muscle Group
                                    </label>
                                    <p className="font-medium capitalize">{exercise.muscleGroup}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Equipment
                                    </label>
                                    <p className="font-medium capitalize">{exercise.equipment}</p>
                                </div>
                            </div>
                            {exercise.description && (
                                <div className="mt-4">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Instructions
                                    </label>
                                    <p className="mt-1 leading-relaxed">{exercise.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ExerciseModal 