import { useState, useMemo, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Input, Textarea, Button, Label, Select } from "@/components/ui";
import { useDashboardData } from "@/hooks/useDashboardData";
import { createEvent, updateEvent, deleteEvent, formatTime, todayStr } from "@/lib/api";
import type { Event } from "@/lib/types";

export function CalendarPage() {
  const { events, categories, refresh } = useDashboardData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr());
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach(e => {
      if (!map[e.event_date]) map[e.event_date] = [];
      map[e.event_date].push(e);
    });
    return map;
  }, [events]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  function openAdd() {
    setEditEvent(null);
    setTitle(""); setDescription(""); setDate(selectedDate || todayStr());
    setStartTime(""); setEndTime(""); setLocation(""); setCategoryId("");
    setModalOpen(true);
  }

  function openEdit(event: Event) {
    setEditEvent(event);
    setTitle(event.title);
    setDescription(event.description || "");
    setDate(event.event_date);
    setStartTime(event.start_time || "");
    setEndTime(event.end_time || "");
    setLocation(event.location || "");
    setCategoryId(event.category_id || "");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (editEvent) {
        await updateEvent(editEvent.id, {
          title: title.trim(),
          description: description.trim() || null,
          event_date: date,
          start_time: startTime || null,
          end_time: endTime || null,
          location: location.trim() || null,
          category_id: categoryId || null,
        });
      } else {
        await createEvent({
          title: title.trim(),
          description: description.trim() || null,
          event_date: date,
          start_time: startTime || null,
          end_time: endTime || null,
          location: location.trim() || null,
          category_id: categoryId || null,
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
    await deleteEvent(id);
    setModalOpen(false);
    refresh();
  }

  async function handleToggleComplete(event: Event) {
    await updateEvent(event.id, { completed: !event.completed });
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Calendar</h1>
        <Button size="sm" onClick={openAdd}><Plus size={14} /> Add Event</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{monthName}</h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-bg-cardHover text-text-muted hover:text-text-primary transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => { setCurrentMonth(new Date()); setSelectedDate(todayStr()); }} className="text-xs text-text-muted hover:text-text-primary px-2">
                Today
              </button>
              <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-bg-cardHover text-text-muted hover:text-text-primary transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[10px] text-text-muted uppercase tracking-wide py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === todayStr();
              const isSelected = dateStr === selectedDate;
              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg p-1.5 flex flex-col items-center gap-0.5 transition-colors border ${
                    isSelected
                      ? "bg-bg-cardHover border-accent-green/40"
                      : "border-transparent hover:bg-bg-cardHover"
                  }`}
                >
                  <span className={`text-xs ${isToday ? "text-accent-green font-bold" : "text-text-secondary"}`}>
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((_, j) => (
                        <span key={j} className="w-1 h-1 rounded-full bg-accent-green" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedEvents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-text-muted">No events on this day.</p>
              </div>
            ) : (
              selectedEvents.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")).map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg bg-bg-input border border-border-primary hover:border-border-secondary transition-colors cursor-pointer ${event.completed ? "opacity-50" : ""}`}
                  onClick={() => openEdit(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${event.completed ? "line-through text-text-muted" : "text-text-primary"}`}>{event.title}</p>
                      {event.start_time && <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1"><Clock size={11} /> {formatTime(event.start_time)}</p>}
                      {event.location && <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1"><MapPin size={11} /> {event.location}</p>}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleComplete(event); }}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                        event.completed ? "bg-accent-green/20 border-accent-green text-accent-green" : "border-border-secondary hover:border-accent-green"
                      }`}
                    >
                      {event.completed && <span className="text-[10px]">✓</span>}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editEvent ? "Edit Event" : "Add Event"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" autoFocus />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>End time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">None</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="flex gap-2 pt-1">
            {editEvent && (
              <Button type="button" variant="danger" onClick={() => handleDelete(editEvent.id)} className="mr-auto">
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
