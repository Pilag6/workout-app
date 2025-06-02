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
  ExternalLink
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
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const sampleExercises: Exercise[] = [
      // Abs
      {
        id: "1",
        name: "Bicycle Crunches",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "Lie on your back and alternate elbow to opposite knee in a pedaling motion.",
        youtubeUrl: "https://www.youtube.com/watch?v=VaL7XWK3MVE&ab_channel=Medbridge"
      },
      {
        id: "2",
        name: "Levitation Crunch",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "Lift your legs and shoulders off the ground and hold the position briefly."
      },
      {
        id: "3",
        name: "Russian Twists",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "Sit with feet off the ground and twist your torso side to side.",
        youtubeUrl: "https://www.youtube.com/watch?v=wkD8rjkodUI"
      },
      {
        id: "4",
        name: "Plank",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "Hold a straight-body position supported by forearms and toes.",
        youtubeUrl: "https://www.youtube.com/watch?v=ASdvN_XEl_c"
      },
      {
        id: "5",
        name: "Side Bridge Twists",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description: "Hold a side plank and twist your torso under and back up."
      },
      {
        id: "6",
        name: "Lying Leg Raises",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "Lie on your back and lift your legs up together without bending the knees."
      },
      {
        id: "7",
        name: "Mountain Climbers",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "In plank position, alternate driving your knees toward your chest quickly."
      },
      {
        id: "8",
        name: "Swipers",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "Sit and pass your feet over an object while keeping your hands behind you for support."
      },
      {
        id: "9",
        name: "Sliding Tucks",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "From a plank, slide your feet forward to your chest and back using socks or sliders."
      },
      {
        id: "10",
        name: "Side Planks",
        muscleGroup: "abs",
        equipment: "bodyweight",
        description:
          "Hold your body in a straight line on your side supported by one forearm."
      },

      // Back
      {
        id: "11",
        name: "Deadlifts",
        muscleGroup: "back",
        equipment: "dumbbells",
        description:
          "Stand and lower dumbbells while keeping your back straight, then lift back up."
      },
      {
        id: "12",
        name: "Renegade Rows",
        muscleGroup: "back",
        equipment: "dumbbells",
        description:
          "In a plank position, row each dumbbell alternately while maintaining balance."
      },
      {
        id: "13",
        name: "Dumbbell Tripod Rows",
        muscleGroup: "back",
        equipment: "dumbbells",
        description:
          "Place one hand on a bench and row a dumbbell with the other hand."
      },
      {
        id: "14",
        name: "Dead Row",
        muscleGroup: "back",
        equipment: "dumbbells",
        description:
          "Perform a row starting from a dead stop at the bottom of the movement."
      },
      {
        id: "15",
        name: "Dumbbell Row",
        muscleGroup: "back",
        equipment: "dumbbells",
        description: "Bend over and pull the dumbbell toward your waist."
      },
      {
        id: "16",
        name: "Pullover",
        muscleGroup: "back",
        equipment: "dumbbells",
        description:
          "Lie on your back and bring a dumbbell from overhead to above your chest."
      },
      {
        id: "17",
        name: "Dumbbell Rows",
        muscleGroup: "back",
        equipment: "dumbbells",
        description: "Pull the dumbbells toward your torso while bent over."
      },
      {
        id: "18",
        name: "Pull-ups",
        muscleGroup: "back",
        equipment: "bodyweight",
        description: "Hang from a bar and pull your chin above the bar.",
        youtubeUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g"
      },
      {
        id: "19",
        name: "Dumbbell Deadlifts",
        muscleGroup: "back",
        equipment: "dumbbells",
        description:
          "Lower dumbbells to mid-shin while keeping your back straight, then lift."
      },

      // Biceps
      {
        id: "20",
        name: "Dumbbell Curls",
        muscleGroup: "biceps",
        equipment: "dumbbells",
        description: "Curl the dumbbells from your sides to your shoulders."
      },
      {
        id: "21",
        name: "Hammer Curls",
        muscleGroup: "biceps",
        equipment: "dumbbells",
        description: "Curl dumbbells with palms facing each other."
      },
      {
        id: "22",
        name: "DB Concentration Curls",
        muscleGroup: "biceps",
        equipment: "dumbbells",
        description:
          "Sit and curl a dumbbell with your elbow resting on your thigh."
      },
      {
        id: "23",
        name: "Zottman Curls",
        muscleGroup: "biceps",
        equipment: "dumbbells",
        description:
          "Curl dumbbells up normally, rotate wrists, and lower with palms down."
      },
      {
        id: "24",
        name: "Dumbbell Drag Curls",
        muscleGroup: "biceps",
        equipment: "dumbbells",
        description:
          "Curl dumbbells while dragging your elbows behind your torso."
      },
      {
        id: "25",
        name: "DB Incline Curls",
        muscleGroup: "biceps",
        equipment: "dumbbells",
        description:
          "Lie back on an incline and curl dumbbells with full range of motion."
      },
      {
        id: "26",
        name: "Dumbbell Bicep Curls",
        muscleGroup: "biceps",
        equipment: "dumbbells",
        description:
          "Lift the dumbbells toward your shoulders by flexing your elbows."
      },

      // Chest
      {
        id: "27",
        name: "Bench Press",
        muscleGroup: "chest",
        equipment: "dumbbells",
        description:
          "Lie on a flat surface and press dumbbells upward from your chest."
      },
      {
        id: "28",
        name: "Push-ups",
        muscleGroup: "chest",
        equipment: "bodyweight",
        description:
          "Lower and raise your body using your arms in a plank position.",
        youtubeUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4"
      },
      {
        id: "29",
        name: "Dumbbell Flyes",
        muscleGroup: "chest",
        equipment: "dumbbells",
        description:
          "With arms extended, lower dumbbells out to the sides and bring them back up."
      },
      {
        id: "30",
        name: "Dumbbell Bench Press",
        muscleGroup: "chest",
        equipment: "dumbbells",
        description:
          "Lie down and press dumbbells from chest level to above your shoulders."
      },

      // legs
      {
        id: "31",
        name: "Deadlifts",
        muscleGroup: "legs",
        equipment: "dumbbells",
        description:
          "Lower dumbbells while keeping legs slightly bent and back straight."
      },
      {
        id: "32",
        name: "Hyperextensions",
        muscleGroup: "legs",
        equipment: "bodyweight",
        description:
          "Bend forward at the waist and lift your torso back to alignment."
      },

      // legs
      {
        id: "33",
        name: "Dumbbell Squats",
        muscleGroup: "legs",
        equipment: "dumbbells",
        description:
          "Hold dumbbells and squat down until thighs are parallel to the ground."
      },
      {
        id: "34",
        name: "Dumbbell Lunges",
        muscleGroup: "legs",
        equipment: "dumbbells",
        description:
          "Step forward into a lunge position while holding dumbbells."
      },
      {
        id: "35",
        name: "Leg Extensions",
        muscleGroup: "legs",
        equipment: "bodyweight",
        description:
          "Straighten your knee from a seated position using your legs."
      },
      {
        id: "36",
        name: "Squats",
        muscleGroup: "legs",
        equipment: "bodyweight",
        description:
          "Lower your hips from a standing position and rise back up."
      },
      {
        id: "37",
        name: "Lunges",
        muscleGroup: "legs",
        equipment: "bodyweight",
        description:
          "Step forward and bend both knees to 90 degrees, then return."
      },

      // Shoulders
      {
        id: "38",
        name: "DB Scoop Press",
        muscleGroup: "shoulders",
        equipment: "dumbbells",
        description:
          "Lift dumbbells in an upward and inward scoop motion overhead."
      },
      {
        id: "39",
        name: "Arnold Press",
        muscleGroup: "shoulders",
        equipment: "dumbbells",
        description: "Rotate dumbbells from front to overhead press position."
      },
      {
        id: "40",
        name: "DB Lateral Raises",
        muscleGroup: "shoulders",
        equipment: "dumbbells",
        description: "Lift dumbbells out to the sides up to shoulder height."
      },
      {
        id: "41",
        name: "DP Hip Huggers",
        muscleGroup: "shoulders",
        equipment: "dumbbells",
        description: "Lift dumbbells slightly forward and up close to the body."
      },
      {
        id: "42",
        name: "DB Front Raises",
        muscleGroup: "shoulders",
        equipment: "dumbbells",
        description: "Lift dumbbells forward until they reach shoulder height."
      },
      {
        id: "43",
        name: "DB Rear Delt Rows",
        muscleGroup: "shoulders",
        equipment: "dumbbells",
        description:
          "Bend forward and row dumbbells outward to target rear delts."
      },
      {
        id: "44",
        name: "DB Over Head Press",
        muscleGroup: "shoulders",
        equipment: "dumbbells",
        description: "Press dumbbells vertically overhead from shoulder level."
      },
      {
        id: "45",
        name: "Dumbbell Shoulder Press",
        muscleGroup: "shoulders",
        equipment: "dumbbells",
        description:
          "Press dumbbells upward from shoulder height until arms are extended."
      },

      // Triceps
      {
        id: "46",
        name: "Diamond Push-Ups",
        muscleGroup: "triceps",
        equipment: "bodyweight",
        description:
          "Place hands close together and perform a push-up to target triceps."
      },
      {
        id: "47",
        name: "Cobra Push-Ups",
        muscleGroup: "triceps",
        equipment: "bodyweight",
        description: "Push-up variation with elbows close to body and hips low."
      },
      {
        id: "48",
        name: "JM Press",
        muscleGroup: "triceps",
        equipment: "dumbbells",
        description: "Lower dumbbells toward the forehead, then press upward."
      },
      {
        id: "49",
        name: "Triceps Kickbacks",
        muscleGroup: "triceps",
        equipment: "dumbbells",
        description:
          "Extend your arm back from a bent-over position to contract triceps."
      },
      {
        id: "50",
        name: "DB Incline Powerbombs",
        muscleGroup: "triceps",
        equipment: "dumbbells",
        description: "Press dumbbells overhead at an incline to target triceps."
      },
      {
        id: "51",
        name: "Close Grip Bench Press",
        muscleGroup: "triceps",
        equipment: "dumbbells",
        description:
          "Press dumbbells from chest level with hands close together."
      },
      {
        id: "52",
        name: "Lying Triceps Extensions",
        muscleGroup: "triceps",
        equipment: "dumbbells",
        description:
          "Lie down and extend dumbbells from forehead to straight arms."
      },
      {
        id: "53",
        name: "1 Arm Over Head Triceps",
        muscleGroup: "triceps",
        equipment: "dumbbells",
        description:
          "Extend one arm overhead with a dumbbell, lowering and lifting behind the head."
      },
      {
        id: "54",
        name: "Dumbbell Tricep Extensions",
        muscleGroup: "triceps",
        equipment: "dumbbells",
        description:
          "Lift a dumbbell overhead and lower behind the head, then extend arms."
      }
    ];

    const saved = localStorage.getItem("workout-exercises");
    if (saved) {
      setExercises(JSON.parse(saved));
    } else {
      setExercises(sampleExercises);
      localStorage.setItem(
        "workout-exercises",
        JSON.stringify(sampleExercises)
      );
    }
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
      const updatedExercises = exercises.map(ex =>
        ex.id === editingExercise.id ? editingExercise : ex
      );
      saveExercises(updatedExercises);
      setEditingExercise(null);
      setIsEditing(false);
      toast({
        title: 'Exercise updated',
        description: `${editingExercise.name} has been updated`
      });
    }
  };

  const cancelEdit = () => {
    setEditingExercise(null);
    setIsEditing(false);
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Import/Export
                </CardTitle>
                <CardDescription>
                  Upload a JSON file or export your current exercises
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
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Exercise
                </CardTitle>
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
          </div>

          <div className="lg:col-span-2 h-screen">
            <Card>
              <CardHeader>
                <CardTitle>
                  Your Exercise Database ({exercises.length} exercises)
                </CardTitle>
                <CardDescription>
                  All exercises available for your workouts
                </CardDescription>
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
                            <Badge variant="outline" className="bg-red-50 text-red-700">
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
          <Dialog open={isEditing} onOpenChange={(open) => !open && cancelEdit()}>
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
                <Button onClick={updateExercise}>
                  Update Exercise
                </Button>
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
