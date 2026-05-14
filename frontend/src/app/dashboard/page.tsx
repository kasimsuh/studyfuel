"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Rating Input ──────────────────────────────────────────────────────────────

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-xl transition-opacity ${
              value !== null && n <= value ? "opacity-100" : "opacity-30"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Sleep Log Form ────────────────────────────────────────────────────────────

function SleepLogForm({ onSuccess }: { onSuccess: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [sleepDate, setSleepDate] = useState(today);
  const [bedtime, setBedtime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [quality, setQuality] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      apiFetch("/logs/sleep", {
        method: "POST",
        body: JSON.stringify({
          sleep_date: sleepDate,
          bedtime: bedtime ? new Date(sleepDate + "T" + bedtime).toISOString() : null,
          wake_time: wakeTime ? new Date(sleepDate + "T" + wakeTime).toISOString() : null,
          quality_rating: quality,
          notes: notes || null,
        }),
      }),
    onSuccess: () => {
      setSleepDate(today);
      setBedtime("");
      setWakeTime("");
      setQuality(null);
      setNotes("");
      setError(null);
      onSuccess();
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    if (!bedtime || !wakeTime) {
      setError("Bedtime and wake time are required");
      return;
    }
    mutate();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sleep_date">Date</Label>
        <Input
          id="sleep_date"
          type="date"
          value={sleepDate}
          onChange={(e) => setSleepDate(e.target.value)}
          max={today}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedtime">Bedtime</Label>
          <Input
            id="bedtime"
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wake_time">Wake time</Label>
          <Input
            id="wake_time"
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            required
          />
        </div>
      </div>
      <RatingInput label="Sleep quality" value={quality} onChange={setQuality} />
      <div className="space-y-2">
        <Label htmlFor="sleep_notes">Notes (optional)</Label>
        <Textarea
          id="sleep_notes"
          placeholder="Anything to note about your sleep…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Log sleep"}
      </Button>
    </form>
  );
}

// ── Meal Log Form ─────────────────────────────────────────────────────────────

function MealLogForm({ onSuccess }: { onSuccess: () => void }) {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [mealTime, setMealTime] = useState(localNow);
  const [mealType, setMealType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [showMacros, setShowMacros] = useState(false);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [caffeine, setCaffeine] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      apiFetch("/logs/meals", {
        method: "POST",
        body: JSON.stringify({
          meal_time: new Date(mealTime).toISOString(),
          meal_type: mealType || null,
          description,
          calories: calories ? parseInt(calories) : null,
          protein_g: protein ? parseFloat(protein) : null,
          carbs_g: carbs ? parseFloat(carbs) : null,
          fat_g: fat ? parseFloat(fat) : null,
          caffeine_mg: caffeine ? parseInt(caffeine) : null,
        }),
      }),
    onSuccess: () => {
      setDescription("");
      setMealType("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setCaffeine("");
      setShowMacros(false);
      setError(null);
      onSuccess();
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    mutate();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meal_time">Time</Label>
          <Input
            id="meal_time"
            type="datetime-local"
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">What did you eat?</Label>
        <Textarea
          id="description"
          placeholder="e.g. oatmeal with banana and a coffee"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          required
        />
      </div>
      <button
        type="button"
        className="text-sm text-muted-foreground underline"
        onClick={() => setShowMacros(!showMacros)}
      >
        {showMacros ? "Hide macros" : "+ Add macros (optional)"}
      </button>
      {showMacros && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="calories" className="text-xs">Calories</Label>
            <Input id="calories" type="number" min="0" placeholder="500" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="caffeine" className="text-xs">Caffeine (mg)</Label>
            <Input id="caffeine" type="number" min="0" placeholder="80" value={caffeine} onChange={(e) => setCaffeine(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
            <Input id="protein" type="number" min="0" placeholder="20" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
            <Input id="carbs" type="number" min="0" placeholder="60" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fat" className="text-xs">Fat (g)</Label>
            <Input id="fat" type="number" min="0" placeholder="15" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Log meal"}
      </Button>
    </form>
  );
}

// ── Study Session Form ────────────────────────────────────────────────────────

function StudySessionForm({ onSuccess }: { onSuccess: () => void }) {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [startedAt, setStartedAt] = useState(localNow);
  const [endedAt, setEndedAt] = useState(localNow);
  const [subject, setSubject] = useState("");
  const [focus, setFocus] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      apiFetch("/logs/study", {
        method: "POST",
        body: JSON.stringify({
          started_at: new Date(startedAt).toISOString(),
          ended_at: new Date(endedAt).toISOString(),
          subject: subject || null,
          focus_rating: focus,
          productivity_notes: notes || null,
        }),
      }),
    onSuccess: () => {
      setSubject("");
      setFocus(null);
      setNotes("");
      setError(null);
      onSuccess();
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    if (new Date(endedAt) <= new Date(startedAt)) {
      setError("End time must be after start time");
      return;
    }
    mutate();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="started_at">Start</Label>
          <Input
            id="started_at"
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ended_at">End</Label>
          <Input
            id="ended_at"
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="e.g. Linear Algebra, Chemistry"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <RatingInput label="Focus rating" value={focus} onChange={setFocus} />
      <div className="space-y-2">
        <Label htmlFor="study_notes">Notes (optional)</Label>
        <Textarea
          id="study_notes"
          placeholder="What went well? What was distracting?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Log session"}
      </Button>
    </form>
  );
}

// ── Recent Entries Lists ──────────────────────────────────────────────────────

function RecentSleepLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["logs", "sleep"],
    queryFn: () => apiFetch("/logs/sleep"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No sleep logs yet.</p>;

  return (
    <ul className="space-y-2">
      {data.slice(0, 5).map((log: { id: string; sleep_date: string; duration_minutes: number | null; quality_rating: number | null }) => (
        <li key={log.id} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{log.sleep_date}</span>
          <span>
            {log.duration_minutes ? `${Math.floor(log.duration_minutes / 60)}h ${log.duration_minutes % 60}m` : "–"}
            {log.quality_rating ? ` · ${"★".repeat(log.quality_rating)}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RecentMealLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["logs", "meals"],
    queryFn: () => apiFetch("/logs/meals"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No meal logs yet.</p>;

  return (
    <ul className="space-y-2">
      {data.slice(0, 5).map((meal: { id: string; meal_time: string; meal_type: string | null; description: string }) => (
        <li key={meal.id} className="flex items-center justify-between text-sm gap-2">
          <span className="text-muted-foreground shrink-0">
            {new Date(meal.meal_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="truncate">{meal.description}</span>
          {meal.meal_type && (
            <span className="shrink-0 text-xs text-muted-foreground capitalize">{meal.meal_type}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function RecentStudyLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["logs", "study"],
    queryFn: () => apiFetch("/logs/study"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No study sessions yet.</p>;

  return (
    <ul className="space-y-2">
      {data.slice(0, 5).map((session: { id: string; started_at: string; subject: string | null; duration_minutes: number | null; focus_rating: number | null }) => (
        <li key={session.id} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground shrink-0">
            {new Date(session.started_at).toLocaleDateString()}
          </span>
          <span className="truncate">{session.subject ?? "Study session"}</span>
          <span className="shrink-0">
            {session.duration_minutes ? `${session.duration_minutes}m` : "–"}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const invalidateLogs = (type: string) => {
    queryClient.invalidateQueries({ queryKey: ["logs", type] });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">StudyFuel</h1>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Log your day</h2>
          <p className="text-muted-foreground text-sm mt-1">Quick logging — under 60 seconds.</p>
        </div>

        <Tabs defaultValue="sleep">
          <TabsList className="w-full">
            <TabsTrigger value="sleep" className="flex-1">😴 Sleep</TabsTrigger>
            <TabsTrigger value="meal" className="flex-1">🥗 Meal</TabsTrigger>
            <TabsTrigger value="study" className="flex-1">📚 Study</TabsTrigger>
          </TabsList>

          <TabsContent value="sleep" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log sleep</CardTitle>
              </CardHeader>
              <CardContent>
                <SleepLogForm onSuccess={() => invalidateLogs("sleep")} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Recent sleep</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentSleepLogs />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meal" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log meal</CardTitle>
              </CardHeader>
              <CardContent>
                <MealLogForm onSuccess={() => invalidateLogs("meals")} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Recent meals</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentMealLogs />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="study" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log study session</CardTitle>
              </CardHeader>
              <CardContent>
                <StudySessionForm onSuccess={() => invalidateLogs("study")} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Recent sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentStudyLogs />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
