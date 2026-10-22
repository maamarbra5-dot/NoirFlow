export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  focus_target_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: "low" | "medium" | "high";
  completed: boolean;
  important: boolean;
  category_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_frequency: number;
  color: string;
  icon: string;
  active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  category_id: string | null;
  completed: boolean;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  mode: "focus" | "short_break" | "long_break";
  duration_minutes: number;
  completed_at: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  completed: boolean;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
}
