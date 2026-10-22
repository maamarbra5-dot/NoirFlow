import { useState, useMemo, type FormEvent } from "react";
import { Plus, Trash2, Edit2, Flame, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Input, Textarea, Button, Label, Select } from "@/components/ui";
import { useDashboardData } from "@/hooks/useDashboardData";
import { createHabit, updateHabit, deleteHabit, toggleHabitLog, getWeekDays, getDayLabel, todayStr } from "@/lib/api";
import type { Habit } from "@/lib/types";

export function HabitsPage() {
  const { habits, habitLogs, refresh } = useDashboardData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetFrequency, setTargetFrequency] = useState(7);
  const [color, setColor] = useState("#81c9a0");
  const [loading, setLoading] = useState(false);

  const weekDays = getWeekDays();
  const today = todayStr();
  const activeHabits = habits.filter(h => h.active);

  function getStreak(habitId: string): number {
    let streak = 0;
    const t = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(t);
      d.setDate(t.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      if (habitLogs.some(log => log.habit_id === habitId && log.log_date === dStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  function getWeeklyRate(habitId: string): number {
    const done = weekDays.filter(day => habitLogs.some(log => log.habit_id === habitId && log.log_date === day)).length;
    return Math.round((done / 7) * 100);
  }

  function openAdd() {
    setEditHabit(null);
    setName(""); setDescription(""); setTargetFrequency(7); setColor("#81c9a0");
    setModalOpen(true);
  }

  function openEdit(habit: Habit) {
    setEditHabit(habit);
    setName(habit.name);
    setDescription(habit.description || "");
    setTargetFrequency(habit.target_frequency);
    setColor(habit.color);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (editHabit) {
        await updateHabit(editHabit.id, {
          name: name.trim(),
          description: description.trim() || null,
          target_frequency: targetFrequency,
          color,
        });
      } else {
        await createHabit({
          name: name.trim(),
          description: description.trim() || null,
          target_frequency: targetFrequency,
          color,
        });
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteHabit(id);
    setModalOpen(false);
    refresh();
  }

  async function handleToggle(habitId: string, date: string) {
    await toggleHabitLog(habitId, date);
    refresh();
  }

  const COLORS = ["#81c9a0", "#e8a06b", "#e17c7c", "#b6a0ed", "#8faebe"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Habits</h1>
        <Button size="sm" onClick={openAdd}><Plus size={14} /> Add Habit</Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-[11px] text-text-muted">Active habits</p>
          <p className="text-xl font-bold text-text-primary mt-1">{activeHabits.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] text-text-muted">Completed today</p>
          <p className="text-xl font-bold text-accent-green mt-1">
            {activeHabits.filter(h => habitLogs.some(log => log.habit_id === h.id && log.log_date === today)).length}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] text-text-muted">Best streak</p>
          <p className="text-xl font-bold text-accent-orange mt-1">
            {Math.max(0, ...activeHabits.map(h => getStreak(h.id)))}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] text-text-muted">Avg weekly rate</p>
          <p className="text-xl font-bold text-accent-blue mt-1">
            {activeHabits.length > 0
              ? Math.round(activeHabits.reduce((sum, h) => sum + getWeeklyRate(h.id), 0) / activeHabits.length)
              : 0}%
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Weekly Tracker" icon={<CheckCircle2 size={14} />} />
        <div className="overflow-x-auto">
          <div className="p-3 min-w-[600px]">
            {activeHabits.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 size={24} className="text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No active habits yet.</p>
                <Button size="sm" variant="secondary" onClick={openAdd} className="mt-3"><Plus size={14} /> Create a habit</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-2 pb-2 border-b border-border-primary/50">
                  <div className="w-36 flex-shrink-0 text-[10px] text-text-muted uppercase tracking-wide">Habit</div>
                  <div className="flex-1 grid grid-cols-7 gap-1.5">
                    {weekDays.map(day => (
                      <div key={day} className="text-center text-[10px] text-text-muted">
                        {getDayLabel(day)}
                        {day === today && <span className="block text-accent-green">•</span>}
                      </div>
                    ))}
                  </div>
                  <div className="w-14 text-center text-[10px] text-text-muted">Streak</div>
                  <div className="w-14 text-center text-[10px] text-text-muted">Rate</div>
                  <div className="w-8" />
                </div>
                {activeHabits.map(habit => (
                  <div key={habit.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-cardHover transition-colors group">
                    <div className="w-36 flex-shrink-0 flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: habit.color }} />
                      <span className="text-xs text-text-secondary truncate">{habit.name}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-7 gap-1.5">
                      {weekDays.map(day => {
                        const done = habitLogs.some(log => log.habit_id === habit.id && log.log_date === day);
                        const isToday = day === today;
                        return (
                          <button
                            key={day}
                            onClick={() => handleToggle(habit.id, day)}
                            className={`aspect-square rounded-md flex items-center justify-center transition-all ${
                              done
                                ? "bg-accent-green/20 text-accent-green"
                                : isToday
                                ? "bg-bg-input border border-border-secondary hover:border-accent-green/50"
                                : "bg-bg-input hover:bg-bg-cardHover"
                            }`}
                          >
                            {done && <CheckCircle2 size={14} />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="w-14 text-center flex items-center justify-center gap-0.5">
                      <Flame size={12} className="text-accent-orange" />
                      <span className="text-xs font-medium text-accent-orange">{getStreak(habit.id)}</span>
                    </div>
                    <div className="w-14 text-center">
                      <span className="text-xs text-text-secondary">{getWeeklyRate(habit.id)}%</span>
                    </div>
                    <div className="w-8 flex gap-1">
                      <button onClick={() => openEdit(habit)} className="text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all">
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editHabit ? "Edit Habit" : "Add Habit"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Habit name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wake up early" autoFocus />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why this habit matters" rows={2} />
          </div>
          <div>
            <Label>Target days per week</Label>
            <Select value={String(targetFrequency)} onChange={(e) => setTargetFrequency(Number(e.target.value))}>
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} day{n > 1 ? "s" : ""}</option>)}
            </Select>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-offset-bg-card ring-white" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            {editHabit && (
              <Button type="button" variant="danger" onClick={() => handleDelete(editHabit.id)} className="mr-auto">
                <Trash2 size={14} /> Delete
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
