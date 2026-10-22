import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTasks, fetchHabits, fetchHabitLogs, fetchEvents,
  fetchFocusSessions, fetchReminders, fetchCategories,
  getWeekDays,
} from "@/lib/api";
import type { Task, Habit, HabitLog, Event, FocusSession, Reminder, Category } from "@/lib/types";

import { supabase } from "@/lib/supabase";

interface DashboardData {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  events: Event[];
  focusSessions: FocusSession[];
  reminders: Reminder[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const weekDays = getWeekDays();
      const [t, h, hl, e, fs, r, c] = await Promise.all([
        fetchTasks(),
        fetchHabits(),
        fetchHabitLogs(weekDays[0], weekDays[6]),
        fetchEvents(),
        fetchFocusSessions(),
        fetchReminders(),
        fetchCategories(),
      ]);
      setTasks(t);
      setHabits(h);
      setHabitLogs(hl);
      setEvents(e);
      setFocusSessions(fs);
      setReminders(r);
      setCategories(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    tasks, habits, habitLogs, events, focusSessions, reminders, categories,
    loading, error, refresh,
  };
}
