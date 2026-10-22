import { supabase } from "@/lib/supabase";
import type { Task, Habit, HabitLog, Event, FocusSession, Reminder, Category } from "@/lib/types";

// ---- Tasks ----
export async function fetchTasks(): Promise<Task[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTask(input: Partial<Task>): Promise<Task | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("tasks").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ---- Habits ----
export async function fetchHabits(): Promise<Habit[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createHabit(input: Partial<Habit>): Promise<Habit | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("habits").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("habits").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteHabit(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) throw error;
}

// ---- Habit Logs ----
export async function fetchHabitLogs(startDate: string, endDate: string): Promise<HabitLog[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .gte("log_date", startDate)
    .lte("log_date", endDate);
  if (error) throw error;
  return data || [];
}

export async function toggleHabitLog(habitId: string, date: string): Promise<void> {
  if (!supabase) return;
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", habitId)
    .eq("log_date", date)
    .maybeSingle();
  if (existing) {
    await supabase.from("habit_logs").delete().eq("id", existing.id);
  } else {
    await supabase.from("habit_logs").insert({ habit_id: habitId, log_date: date });
  }
}

// ---- Events ----
export async function fetchEvents(startDate?: string, endDate?: string): Promise<Event[]> {
  if (!supabase) return [];
  let query = supabase.from("events").select("*").order("event_date", { ascending: true });
  if (startDate) query = query.gte("event_date", startDate);
  if (endDate) query = query.lte("event_date", endDate);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createEvent(input: Partial<Event>): Promise<Event | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("events").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("events").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// ---- Focus Sessions ----
export async function fetchFocusSessions(startDate?: string, endDate?: string): Promise<FocusSession[]> {
  if (!supabase) return [];
  let query = supabase
    .from("focus_sessions")
    .select("*")
    .order("completed_at", { ascending: false });
  if (startDate) query = query.gte("completed_at", startDate);
  if (endDate) query = query.lte("completed_at", endDate);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createFocusSession(input: Partial<FocusSession>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("focus_sessions").insert(input);
  if (error) throw error;
}

export async function deleteFocusSession(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("focus_sessions").delete().eq("id", id);
  if (error) throw error;
}

// ---- Reminders ----
export async function fetchReminders(): Promise<Reminder[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function createReminder(input: Partial<Reminder>): Promise<Reminder | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("reminders").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("reminders").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteReminder(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}

// ---- Categories ----
export async function fetchCategories(): Promise<Category[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCategory(input: Partial<Category>): Promise<Category | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("categories").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("categories").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ---- Date helpers ----
export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function getWeekDays(): string[] {
  const days: string[] = [];
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
