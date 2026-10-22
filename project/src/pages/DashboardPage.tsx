import { useState, useMemo } from "react";
import {
  CheckCircle2, Circle, Target, Timer, Plus, ListTodo,
  TrendingUp, ChevronRight, Calendar as CalendarIcon,
  Flag,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { Card, CardHeader } from "@/components/Card";
import { QuickAddModal } from "@/components/QuickAddModal";
import { AssistantCard } from "@/components/AssistantCard";
import { UpcomingEvents, RemindersCard } from "@/components/RightColumn";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/context/AuthContext";
import {
  updateTask, deleteTask, toggleHabitLog, todayStr,
  formatDate, formatTime, formatDuration, getWeekDays, getDayLabel,
} from "@/lib/api";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import type { Task, Category } from "@/lib/types";

export function DashboardPage() {
  const { tasks, habits, habitLogs, events, focusSessions, reminders, categories, loading, error, refresh } = useDashboardData();
  const { appUser } = useAuth();
  const [quickAdd, setQuickAdd] = useState<"task" | "habit" | "event" | null>(null);
  const [taskFilter, setTaskFilter] = useState<"all" | "important" | "completed">("all");
  const [metric, setMetric] = useState<"tasks" | "focus" | "habits">("tasks");

  const today = todayStr();
  const weekDays = getWeekDays();

  // Daily progress
  const todayTasks = useMemo(() => tasks.filter(t => t.due_date === today), [tasks, today]);
  const completedTasks = todayTasks.filter(t => t.completed).length;
  const totalTasks = todayTasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Habits
  const activeHabits = habits.filter(h => h.active);
  const completedHabitsToday = activeHabits.filter(h =>
    habitLogs.some(log => log.habit_id === h.id && log.log_date === today)
  ).length;

  // Focus
  const todayFocusMin = focusSessions
    .filter(s => s.completed_at.startsWith(today) && s.mode === "focus")
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const focusTarget = appUser ? 120 : 120;
  const focusSessionsCount = focusSessions.filter(s => s.completed_at.startsWith(today) && s.mode === "focus").length;

  // Today's schedule (events + tasks with due_time, sorted)
  const schedule = useMemo(() => {
    const eventItems = events
      .filter(e => e.event_date === today)
      .map(e => ({ id: e.id, type: "event" as const, title: e.title, time: e.start_time, description: e.description, completed: e.completed, category: categories.find(c => c.id === e.category_id)?.name }));
    const taskItems = tasks
      .filter(t => t.due_date === today && t.due_time)
      .map(t => ({ id: t.id, type: "task" as const, title: t.title, time: t.due_time, description: t.description, completed: t.completed, category: categories.find(c => c.id === t.category_id)?.name }));
    return [...eventItems, ...taskItems].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [events, tasks, today, categories]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => t.due_date === today);
    if (taskFilter === "important") result = result.filter(t => t.important);
    if (taskFilter === "completed") result = result.filter(t => t.completed);
    return result;
  }, [tasks, today, taskFilter]);

  // Weekly chart data
  const chartData = useMemo(() => {
    return weekDays.map(day => {
      const dayTasks = tasks.filter(t => t.due_date === day && t.completed).length;
      const dayFocus = focusSessions
        .filter(s => s.completed_at.startsWith(day) && s.mode === "focus")
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      const dayHabitsTotal = activeHabits.length;
      const dayHabitsDone = habitLogs.filter(log => log.log_date === day).length;
      const habitRate = dayHabitsTotal > 0 ? Math.round((dayHabitsDone / dayHabitsTotal) * 100) : 0;
      return {
        day: getDayLabel(day),
        tasks: dayTasks,
        focus: dayFocus,
        habits: habitRate,
      };
    });
  }, [weekDays, tasks, focusSessions, habitLogs, activeHabits]);

  // Streak calculation for habits
  function getStreak(habitId: string): number {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      if (habitLogs.some(log => log.habit_id === habitId && log.log_date === dStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  async function handleToggleTask(task: Task) {
    await updateTask(task.id, { completed: !task.completed });
    refresh();
  }

  async function handleDeleteTask(id: string) {
    await deleteTask(id);
    refresh();
  }

  async function handleToggleHabit(habitId: string) {
    await toggleHabitLog(habitId, today);
    refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-border-secondary border-t-accent-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Top row: Progress + Habits + Focus + Quick Add */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Daily Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-accent-green" />
              <h3 className="text-sm font-semibold text-text-primary">Daily Progress</h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1d272e" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="#81c9a0" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-text-primary">{progress}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary">
                <span className="text-text-primary font-semibold">{completedTasks}</span> of {totalTasks} tasks
              </p>
              <p className="text-[11px] text-text-muted mt-1">completed today</p>
              <div className="mt-2 h-1.5 bg-bg-input rounded-full overflow-hidden">
                <div className="h-full bg-accent-green rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Habit Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-accent-blue" />
              <h3 className="text-sm font-semibold text-text-primary">Habit Summary</h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{completedHabitsToday}</p>
              <p className="text-[11px] text-text-muted">of {activeHabits.length}</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-1">
                {weekDays.map(day => {
                  const count = habitLogs.filter(log => log.log_date === day).length;
                  const total = activeHabits.length;
                  const pct = total > 0 ? count / total : 0;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-12 bg-bg-input rounded relative overflow-hidden">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-accent-blue/60 transition-all duration-300"
                          style={{ height: `${pct * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-text-muted">{getDayLabel(day).charAt(0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Focus Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-accent-orange" />
              <h3 className="text-sm font-semibold text-text-primary">Focus Summary</h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{formatDuration(todayFocusMin)}</p>
              <p className="text-[11px] text-text-muted">of {formatDuration(focusTarget)} target</p>
            </div>
            <div className="flex-1">
              <div className="h-1.5 bg-bg-input rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-accent-orange rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (todayFocusMin / focusTarget) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted">{focusSessionsCount} session{focusSessionsCount !== 1 ? "s" : ""} completed</p>
            </div>
          </div>
        </Card>

        {/* Quick Add */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={14} className="text-accent-purple" />
            <h3 className="text-sm font-semibold text-text-primary">Quick Add</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Add Task", type: "task" as const, icon: ListTodo, color: "text-accent-green" },
              { label: "Add Habit", type: "habit" as const, icon: CheckCircle2, color: "text-accent-blue" },
              { label: "Add Event", type: "event" as const, icon: CalendarIcon, color: "text-accent-orange" },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => setQuickAdd(item.type)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-input border border-border-primary hover:border-border-secondary transition-colors text-left group"
              >
                <item.icon size={15} className={item.color} />
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">{item.label}</span>
                <ChevronRight size={14} className="ml-auto text-text-muted group-hover:text-text-secondary transition-colors" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Middle row: Today's Schedule + Today's Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <Card>
          <CardHeader title="Today's Schedule" icon={<CalendarIcon size={14} />} />
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {schedule.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarIcon size={20} className="text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">Nothing scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.map((item, i) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                    <div className="flex flex-col items-center w-14 flex-shrink-0">
                      <span className="text-xs font-medium text-text-primary">{formatTime(item.time)}</span>
                      {i < schedule.length - 1 && <div className="w-px h-full bg-border-primary mt-1" />}
                    </div>
                    <div className={`flex-1 pb-3 ${item.completed ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-2">
                        {item.completed ? (
                          <CheckCircle2 size={14} className="text-accent-green flex-shrink-0" />
                        ) : (
                          <Circle size={14} className="text-text-muted flex-shrink-0" />
                        )}
                        <p className={`text-sm ${item.completed ? "line-through text-text-muted" : "text-text-primary"}`}>
                          {item.title}
                        </p>
                      </div>
                      {item.description && <p className="text-xs text-text-muted mt-1 ml-6">{item.description}</p>}
                      {item.category && (
                        <span className="inline-block text-[10px] text-text-muted bg-bg-input rounded px-1.5 py-0.5 ml-6 mt-1">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader
            title="Today's Tasks"
            icon={<ListTodo size={14} />}
            action={
              <div className="flex gap-1">
                {(["all", "important", "completed"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`text-[11px] px-2 py-1 rounded transition-colors capitalize ${
                      taskFilter === f
                        ? "bg-bg-cardHover text-text-primary"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            }
          />
          <div className="p-3 max-h-[300px] overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="py-8 text-center">
                <ListTodo size={20} className="text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">No tasks for today.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-bg-cardHover transition-colors group">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task)}
                      className="noir-checkbox"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.completed ? "line-through text-text-muted" : "text-text-primary"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.due_time && <span className="text-[10px] text-text-muted">{formatTime(task.due_time)}</span>}
                        <span className="text-[10px]" style={{ color: PRIORITY_COLORS[task.priority] }}>
                          <Flag size={9} className="inline" /> {PRIORITY_LABELS[task.priority]}
                        </span>
                        {task.category_id && categories.find(c => c.id === task.category_id) && (
                          <span className="text-[10px] text-text-muted">
                            {categories.find(c => c.id === task.category_id)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    >
                      <span className="text-xs">Delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Habit Tracker + Weekly Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Habit Tracker */}
        <Card>
          <CardHeader title="Habit Tracker" icon={<CheckCircle2 size={14} />} />
          <div className="p-3 max-h-[280px] overflow-y-auto">
            {activeHabits.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={20} className="text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">No active habits. Add one to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-1">
              {/* Day labels */}
              <div className="flex items-center gap-2 px-2 pb-2 border-b border-border-primary/50">
                <div className="w-32 flex-shrink-0 text-[10px] text-text-muted uppercase tracking-wide">Habit</div>
                <div className="flex-1 grid grid-cols-7 gap-1">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-[10px] text-text-muted">
                      {getDayLabel(day).charAt(0)}
                    </div>
                  ))}
                </div>
                <div className="w-12 text-center text-[10px] text-text-muted">Streak</div>
              </div>
              {activeHabits.map(habit => {
                const doneToday = habitLogs.some(log => log.habit_id === habit.id && log.log_date === today);
                return (
                  <div key={habit.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-cardHover transition-colors">
                    <div className="w-32 flex-shrink-0 flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: habit.color }} />
                      <span className="text-xs text-text-secondary truncate">{habit.name}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-7 gap-1">
                      {weekDays.map(day => {
                        const done = habitLogs.some(log => log.habit_id === habit.id && log.log_date === day);
                        const isToday = day === today;
                        return (
                          <button
                            key={day}
                            onClick={() => handleToggleHabit(habit.id)}
                            className={`w-full aspect-square rounded flex items-center justify-center transition-all ${
                              done
                                ? "bg-accent-green/20 text-accent-green"
                                : isToday
                                ? "bg-bg-input border border-border-secondary hover:border-accent-green/50"
                                : "bg-bg-input hover:bg-bg-cardHover"
                            }`}
                          >
                            {done && <CheckCircle2 size={12} />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="w-12 text-center">
                      <span className="text-xs font-medium text-accent-orange">{getStreak(habit.id)}</span>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader
            title="Weekly Activity"
            icon={<TrendingUp size={14} />}
            action={
              <div className="flex gap-1">
                {(["tasks", "focus", "habits"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`text-[11px] px-2 py-1 rounded transition-colors capitalize ${
                      metric === m
                        ? "bg-bg-cardHover text-text-primary"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {m === "focus" ? "Focus" : m === "tasks" ? "Tasks" : "Habits"}
                  </button>
                ))}
              </div>
            }
          />
          <div className="p-4 h-[260px]">
            {metric === "tasks" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d272e" />
                  <XAxis dataKey="day" stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#0a1014", border: "1px solid #1d272e", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#f5f7f8" }}
                  />
                  <Bar dataKey="tasks" fill="#81c9a0" radius={[4, 4, 0, 0]} name="Completed tasks" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {metric === "focus" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d272e" />
                  <XAxis dataKey="day" stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0a1014", border: "1px solid #1d272e", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#f5f7f8" }}
                  />
                  <Line type="monotone" dataKey="focus" stroke="#e8a06b" strokeWidth={2} dot={{ fill: "#e8a06b", r: 3 }} name="Focus minutes" />
                </LineChart>
              </ResponsiveContainer>
            )}
            {metric === "habits" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d272e" />
                  <XAxis dataKey="day" stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "#0a1014", border: "1px solid #1d272e", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#f5f7f8" }}
                  />
                  <Bar dataKey="habits" fill="#8faebe" radius={[4, 4, 0, 0]} name="Habit completion %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Life Categories */}
      <Card>
        <CardHeader title="Life Categories" icon={<TrendingUp size={14} />} />
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { name: "Study", color: "#8faebe" },
            { name: "Work", color: "#b6a0ed" },
            { name: "Gym", color: "#e17c7c" },
            { name: "Meals", color: "#e8a06b" },
            { name: "Water", color: "#8faebe" },
            { name: "Sleep", color: "#b6a0ed" },
            { name: "Projects", color: "#81c9a0" },
          ].map(cat => (
            <button
              key={cat.name}
              onClick={() => window.location.href = `/categories?name=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-bg-input border border-border-primary hover:border-border-secondary transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}20` }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
              </div>
              <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">{cat.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Quick Add Modal */}
      {quickAdd && (
        <QuickAddModal
          open={true}
          onClose={() => setQuickAdd(null)}
          type={quickAdd}
          categories={categories}
          onCreated={refresh}
        />
      )}

      {/* Right column content rendered by AppLayout */}
      <div className="hidden">
        <AssistantCard tasks={tasks} habits={habits} events={events} focusSessions={focusSessions} />
        <UpcomingEvents events={events} />
        <RemindersCard reminders={reminders} onRefresh={refresh} />
      </div>
    </div>
  );
}

// Export right column content for AppLayout
export function DashboardRightColumn() {
  const { tasks, habits, events, focusSessions, reminders, refresh } = useDashboardData();
  return (
    <>
      <AssistantCard tasks={tasks} habits={habits} events={events} focusSessions={focusSessions} />
      <UpcomingEvents events={events} />
      <RemindersCard reminders={reminders} onRefresh={refresh} />
    </>
  );
}
