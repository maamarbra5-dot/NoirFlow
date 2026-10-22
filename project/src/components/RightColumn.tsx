import { useState, type FormEvent } from "react";
import { Calendar, Plus, Check, Trash2, Bell } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Input, Button, Label } from "@/components/ui";
import { createReminder, updateReminder, deleteReminder, formatDate, formatTime, todayStr } from "@/lib/api";
import type { Event, Reminder } from "@/lib/types";

interface UpcomingEventsProps {
  events: Event[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const upcoming = events
    .filter(e => e.event_date >= todayStr)
    .sort((a, b) => (a.event_date + (a.start_time || "")).localeCompare(b.event_date + (b.start_time || "")))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader title="Upcoming Events" icon={<Calendar size={14} />} />
      <div className="p-3 space-y-1.5 max-h-[280px] overflow-y-auto">
        {upcoming.length === 0 ? (
          <div className="py-6 text-center">
            <Calendar size={20} className="text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">No upcoming events.</p>
          </div>
        ) : (
          upcoming.map(event => (
            <div key={event.id} className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-bg-cardHover transition-colors">
              <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-bg-input flex-shrink-0">
                <span className="text-[10px] text-text-muted uppercase">
                  {new Date(event.event_date + "T00:00:00").toLocaleDateString(undefined, { month: "short" })}
                </span>
                <span className="text-sm font-semibold text-text-primary leading-none mt-0.5">
                  {new Date(event.event_date + "T00:00:00").getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{event.title}</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {formatTime(event.start_time) || formatDate(event.event_date)}
                  {event.location && ` · ${event.location}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

interface RemindersCardProps {
  reminders: Reminder[];
  onRefresh: () => void;
}

export function RemindersCard({ reminders, onRefresh }: RemindersCardProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [dueTime, setDueTime] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createReminder({
        title: title.trim(),
        due_date: dueDate || null,
        due_time: dueTime || null,
      });
      setTitle(""); setDueTime(""); setOpen(false);
      onRefresh();
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, completed: boolean) {
    await updateReminder(id, { completed: !completed });
    onRefresh();
  }

  async function handleDelete(id: string) {
    await deleteReminder(id);
    onRefresh();
  }

  const active = reminders.filter(r => !r.completed).slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Reminders"
        icon={<Bell size={14} />}
        action={
          <button onClick={() => setOpen(true)} className="text-text-muted hover:text-accent-green transition-colors">
            <Plus size={15} />
          </button>
        }
      />
      <div className="p-3 space-y-1.5 max-h-[220px] overflow-y-auto">
        {active.length === 0 ? (
          <div className="py-6 text-center">
            <Bell size={20} className="text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">No active reminders.</p>
          </div>
        ) : (
          active.map(reminder => (
            <div key={reminder.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-cardHover transition-colors group">
              <button
                onClick={() => handleToggle(reminder.id, reminder.completed)}
                className="w-4 h-4 rounded border border-border-secondary hover:border-accent-green transition-colors flex items-center justify-center flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary truncate">{reminder.title}</p>
                <p className="text-[10px] text-text-muted">
                  {formatDate(reminder.due_date)} {formatTime(reminder.due_time)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Reminder">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <Label>Reminder</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Submit assignment" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Adding..." : "Add"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
