"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Upload,
  Download,
  Plus,
  Trash2,
  ArrowLeft,
  Dumbbell,
  User,
  Play,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ExerciseModal from "@/components/ExerciseModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import sampleExercisesData from "@/data/sampleExercises.json";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: "dumbbells" | "bodyweight";
  description?: string;
  youtubeUrl?: string;
}

const muscleGroups = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "abs"
];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({});
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Map the sample data to match our Exercise interface, converting id from number to string
    const sampleExercises: Exercise[] = (sampleExercisesData as any[]).map(
      (exercise) => ({
        ...exercise,
        id: String(exercise.id),
        equipment: exercise.equipment as "dumbbells" | "bodyweight"
      })
    );

    setExercises(sampleExercises);
    localStorage.setItem("workout-exercises", JSON.stringify(sampleExercises));
  }, []);

  const saveExercises = (newExercises: Exercise[]) => {
    setExercises(newExercises);
    localStorage.setItem("workout-exercises", JSON.stringify(newExercises));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (Array.isArray(data)) {
            const validExercises = data.filter(
              (ex) => ex.name && ex.muscleGroup && ex.equipment
            );
            saveExercises(validExercises);
            toast({
              title: "Exercises imported",
              description: `Successfully imported ${validExercises.length} exercises`
            });
          }
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid JSON file format",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const exportExercises = () => {
    const dataStr = JSON.stringify(exercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workout-exercises.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const addExercise = () => {
    if (newExercise.name && newExercise.muscleGroup && newExercise.equipment) {
      const exercise: Exercise = {
        id: Date.now().toString(),
        name: newExercise.name,
        muscleGroup: newExercise.muscleGroup,
        equipment: newExercise.equipment,
        description: newExercise.description || "",
        youtubeUrl: newExercise.youtubeUrl || undefined
      };
      saveExercises([...exercises, exercise]);
      setNewExercise({});
      setIsAdding(false);
      toast({
        title: "Exercise added",
        description: `${exercise.name} has been added to your database`
      });
    }
  };

  const deleteExercise = (id: string) => {
    saveExercises(exercises.filter((ex) => ex.id !== id));
    toast({
      title: "Exercise deleted",
      description: "Exercise has been removed from your database"
    });
  };

  const openExerciseModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const closeExerciseModal = () => {
    setSelectedExercise(null);
    setIsModalOpen(false);
  };

  const startEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setIsEditing(true);
  };

  const updateExercise = () => {
    if (editingExercise) {
      const updatedExercises = exercises.map((ex) =>
        ex.id === editingExercise.id ? editingExercise : ex
      );
      saveExercises(updatedExercises);
      setEditingExercise(null);
      setIsEditing(false);
      toast({
        title: "Exercise updated",
        description: `${editingExercise.name} has been updated`
      });
    }
  };

  const cancelEdit = () => {
    setEditingExercise(null);
    setIsEditing(false);
  };

  const resetToDefaults = () => {
    // Map the sample data to match our Exercise interface, similar to what we do in useEffect
    const sampleExercises: Exercise[] = (sampleExercisesData as any[]).map(
      (exercise) => ({
        ...exercise,
        id: String(exercise.id),
        equipment: exercise.equipment as "dumbbells" | "bodyweight"
      })
    );

    setExercises(sampleExercises);
    localStorage.setItem("workout-exercises", JSON.stringify(sampleExercises));
    toast({
      title: "Reset complete",
      description: "Exercises have been reset to default values"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Manage Exercises</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <p>
              There are 86 exercises to get you started — but you can always add
              more.
            </p>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Exercise <span className="ml-1 text-base"> (optional)</span>
                </CardTitle>
                <CardDescription>
                  If you add new exercises, don’t forget to export them so you
                  can reuse them later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAdding ? (
                  <Button onClick={() => setIsAdding(true)} className="w-full">
                    Add New Exercise
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Exercise Name</Label>
                      <Input
                        id="name"
                        value={newExercise.name || ""}
                        onChange={(e) =>
                          setNewExercise({
                            ...newExercise,
                            name: e.target.value
                          })
                        }
                        placeholder="e.g., Push-ups"
                      />
                    </div>
                    <div>
                      <Label htmlFor="muscle-group">Muscle Group</Label>
                      <Select
                        value={newExercise.muscleGroup || ""}
                        onValueChange={(value) =>
                          setNewExercise({ ...newExercise, muscleGroup: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select muscle group" />
                        </SelectTrigger>
                        <SelectContent>
                          {muscleGroups.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group.charAt(0).toUpperCase() + group.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="equipment">Equipment</Label>
                      <Select
                        value={newExercise.equipment || ""}
                        onValueChange={(value: "dumbbells" | "bodyweight") =>
                          setNewExercise({ ...newExercise, equipment: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bodyweight">Bodyweight</SelectItem>
                          <SelectItem value="dumbbells">Dumbbells</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        value={newExercise.description || ""}
                        onChange={(e) =>
                          setNewExercise({
                            ...newExercise,
                            description: e.target.value
                          })
                        }
                        placeholder="Brief description or instructions"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="youtube-url">
                        YouTube Video URL (Optional)
                      </Label>
                      <Input
                        id="youtube-url"
                        value={newExercise.youtubeUrl || ""}
                        onChange={(e) =>
                          setNewExercise({
                            ...newExercise,
                            youtubeUrl: e.target.value
                          })
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        type="url"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Paste a YouTube video URL to show exercise demonstration
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addExercise} className="flex-1">
                        Add
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAdding(false);
                          setNewExercise({});
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Import/Export <span className="ml-1 text-base"> (optional)</span>
                </CardTitle>
                <CardDescription>
                  Upload a JSON file or export your current exercises list
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload JSON File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={exportExercises}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Exercises
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ready to start a workout?</CardTitle>
                <CardDescription>
                  Begin your training session using your created exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/workout">
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Workout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Your Exercise Database ({exercises.length} exercises)
                    </CardTitle>
                    <CardDescription>
                      All exercises available for your workouts
                    </CardDescription>
                  </div>
                  {/* <Button
                    onClick={resetToDefaults}
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button> */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => openExerciseModal(exercise)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{exercise.name}</h3>
                          <Badge variant="secondary">
                            {exercise.muscleGroup}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {exercise.equipment === "dumbbells" ? (
                              <Dumbbell className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {exercise.equipment}
                          </Badge>
                          {exercise.youtubeUrl && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700"
                            >
                              📹 Video
                            </Badge>
                          )}
                        </div>
                        {exercise.description && (
                          <p className="text-sm text-muted-foreground">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditExercise(exercise);
                          }}
                          className="text-primary hover:text-primary"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteExercise(exercise.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {exercises.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No exercises found. Add some exercises to get started!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isEditing && editingExercise && (
          <Dialog
            open={isEditing}
            onOpenChange={(open) => !open && cancelEdit()}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Exercise</DialogTitle>
                <DialogDescription>
                  Update the exercise details and YouTube video URL
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Exercise Name</Label>
                  <Input
                    id="edit-name"
                    value={editingExercise.name}
                    onChange={(e) =>
                      setEditingExercise({
                        ...editingExercise,
                        name: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingExercise.description || ""}
                    onChange={(e) =>
                      setEditingExercise({
                        ...editingExercise,
                        description: e.target.value
                      })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-youtube">YouTube Video URL</Label>
                  <Input
                    id="edit-youtube"
                    value={editingExercise.youtubeUrl || ""}
                    onChange={(e) =>
                      setEditingExercise({
                        ...editingExercise,
                        youtubeUrl: e.target.value
                      })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste a YouTube video URL to show exercise demonstration
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button onClick={updateExercise}>Update Exercise</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <ExerciseModal
          exercise={selectedExercise}
          isOpen={isModalOpen}
          onClose={closeExerciseModal}
        />
      </div>
    </div>
  );
}
