import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, CheckCircle2, Timer, Repeat, Target } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getWeekDays, getDayLabel, formatDuration, todayStr } from "@/lib/api";

export function AnalyticsPage() {
  const { tasks, habits, habitLogs, focusSessions } = useDashboardData();
  const weekDays = getWeekDays();
  const today = todayStr();

  const activeHabits = habits.filter(h => h.active);

  // Weekly data
  const weeklyData = useMemo(() => {
    return weekDays.map(day => {
      const completed = tasks.filter(t => t.due_date === day && t.completed).length;
      const total = tasks.filter(t => t.due_date === day).length;
      const focusMin = focusSessions
        .filter(s => s.completed_at.startsWith(day) && s.mode === "focus")
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      const habitDone = habitLogs.filter(log => log.log_date === day).length;
      const habitRate = activeHabits.length > 0 ? Math.round((habitDone / activeHabits.length) * 100) : 0;
      return {
        day: getDayLabel(day),
        completed,
        total,
        focusMin,
        habitRate,
      };
    });
  }, [weekDays, tasks, focusSessions, habitLogs, activeHabits]);

  // Task priority distribution
  const priorityData = useMemo(() => {
    const high = tasks.filter(t => t.priority === "high").length;
    const medium = tasks.filter(t => t.priority === "medium").length;
    const low = tasks.filter(t => t.priority === "low").length;
    return [
      { name: "High", value: high, color: "#e17c7c" },
      { name: "Medium", value: medium, color: "#e8a06b" },
      { name: "Low", value: low, color: "#81c9a0" },
    ];
  }, [tasks]);

  // Totals
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFocusMin = focusSessions.filter(s => s.mode === "focus").reduce((sum, s) => sum + s.duration_minutes, 0);
  const todayFocusMin = focusSessions.filter(s => s.completed_at.startsWith(today) && s.mode === "focus").reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalSessions = focusSessions.filter(s => s.mode === "focus").length;

  // Focus trend (last 7 days)
  const focusTrend = useMemo(() => {
    return weekDays.map(day => ({
      day: getDayLabel(day),
      minutes: focusSessions
        .filter(s => s.completed_at.startsWith(day) && s.mode === "focus")
        .reduce((sum, s) => sum + s.duration_minutes, 0),
    }));
  }, [weekDays, focusSessions]);

  const COLORS = ["#e17c7c", "#e8a06b", "#81c9a0"];

  const stats = [
    { label: "Total tasks", value: totalTasks, icon: Target, color: "text-accent-green" },
    { label: "Completion rate", value: `${completionRate}%`, icon: CheckCircle2, color: "text-accent-blue" },
    { label: "Total focus time", value: formatDuration(totalFocusMin), icon: Timer, color: "text-accent-orange" },
    { label: "Focus sessions", value: totalSessions, icon: Repeat, color: "text-accent-purple" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Analytics</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-text-muted">{stat.label}</p>
                  <p className="text-xl font-bold text-text-primary mt-1">{stat.value}</p>
                </div>
                <Icon size={20} className={stat.color} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks completed per day */}
        <Card>
          <CardHeader title="Tasks Completed Per Day" icon={<CheckCircle2 size={14} />} />
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d272e" />
                <XAxis dataKey="day" stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0a1014", border: "1px solid #1d272e", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#f5f7f8" }}
                />
                <Bar dataKey="completed" fill="#81c9a0" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Focus minutes per day */}
        <Card>
          <CardHeader title="Focus Minutes Per Day" icon={<Timer size={14} />} />
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusTrend}>
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8a06b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#e8a06b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d272e" />
                <XAxis dataKey="day" stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0a1014", border: "1px solid #1d272e", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#f5f7f8" }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#e8a06b" strokeWidth={2} fill="url(#focusGrad)" name="Focus minutes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Habit completion rate */}
        <Card>
          <CardHeader title="Habit Completion Rate" icon={<Repeat size={14} />} />
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d272e" />
                <XAxis dataKey="day" stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#72808a" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ background: "#0a1014", border: "1px solid #1d272e", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#f5f7f8" }}
                />
                <Line type="monotone" dataKey="habitRate" stroke="#8faebe" strokeWidth={2} dot={{ fill: "#8faebe", r: 3 }} name="Completion %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority distribution */}
        <Card>
          <CardHeader title="Task Priority Distribution" icon={<Target size={14} />} />
          <div className="p-4 h-[260px] flex items-center justify-center">
            {totalTasks === 0 ? (
              <p className="text-sm text-text-muted">No tasks to analyze.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0a1014", border: "1px solid #1d272e", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#f5f7f8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {totalTasks > 0 && (
            <div className="px-4 pb-4 flex justify-center gap-4">
              {priorityData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                  <span className="text-[11px] text-text-secondary">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
