"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type GoalType =
  | "improve_sleep"
  | "increase_focus"
  | "gain_muscle"
  | "lose_weight"
  | "improve_grades"
  | "reduce_stress";

const GOALS: { value: GoalType; label: string; emoji: string }[] = [
  { value: "improve_sleep", label: "Better Sleep", emoji: "😴" },
  { value: "increase_focus", label: "More Focus", emoji: "🧠" },
  { value: "gain_muscle", label: "Gain Muscle", emoji: "💪" },
  { value: "lose_weight", label: "Lose Weight", emoji: "⚖️" },
  { value: "improve_grades", label: "Better Grades", emoji: "📚" },
  { value: "reduce_stress", label: "Less Stress", emoji: "🧘" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    display_name: "",
    age: "",
    biological_sex: "" as string | null,
    height_cm: "",
    weight_kg: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [selectedGoals, setSelectedGoals] = useState<GoalType[]>([]);

  function toggleGoal(goal: GoalType) {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : prev.length < 3
        ? [...prev, goal]
        : prev
    );
  }

  async function handleProfileSubmit() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/profiles/me", {
        method: "POST",
        body: JSON.stringify({
          display_name: profile.display_name || null,
          age: profile.age ? parseInt(profile.age) : null,
          biological_sex: profile.biological_sex || null,
          height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
          weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
          timezone: profile.timezone,
        }),
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoalsSubmit() {
    if (selectedGoals.length === 0) {
      setError("Please select at least one goal");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      for (const goal_type of selectedGoals) {
        await apiFetch("/goals", {
          method: "POST",
          body: JSON.stringify({ goal_type }),
        });
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goals");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex gap-2 mb-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
              <CardDescription>Step 1 of 2 — Your profile helps us personalize advice</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleProfileSubmit(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Name (optional)</Label>
                  <Input
                    id="display_name"
                    placeholder="Alex"
                    value={profile.display_name}
                    onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="13"
                      max="120"
                      placeholder="21"
                      value={profile.age}
                      onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Biological sex</Label>
                    <Select
                      value={profile.biological_sex}
                      onValueChange={(v) => setProfile((p) => ({ ...p, biological_sex: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="100"
                      max="250"
                      placeholder="170"
                      value={profile.height_cm}
                      onChange={(e) => setProfile((p) => ({ ...p, height_cm: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="30"
                      max="300"
                      placeholder="65"
                      value={profile.weight_kg}
                      onChange={(e) => setProfile((p) => ({ ...p, weight_kg: e.target.value }))}
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving…" : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>What are your goals?</CardTitle>
              <CardDescription>Step 2 of 2 — Pick 1–3 goals. You can change them later.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleGoalsSubmit(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map((goal) => {
                    const selected = selectedGoals.includes(goal.value);
                    return (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => toggleGoal(goal.value)}
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-colors ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <span className="text-2xl">{goal.emoji}</span>
                        <span>{goal.label}</span>
                        {selected && (
                          <Badge className="absolute top-1.5 right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                            ✓
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedGoals.length} / 3 selected
                </p>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || selectedGoals.length === 0}
                >
                  {loading ? "Saving…" : "Go to dashboard"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
