import { useState, type FormEvent } from "react";
import { Modal } from "@/components/Modal";
import { Input, Textarea, Select, Button, Label } from "@/components/ui";
import { createTask, createHabit, createEvent, todayStr } from "@/lib/api";
import type { Category } from "@/lib/types";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  type: "task" | "habit" | "event";
  categories: Category[];
  onCreated: () => void;
}

export function QuickAddModal({ open, onClose, type, categories, onCreated }: QuickAddModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categoryId, setCategoryId] = useState("");
  const [targetFrequency, setTargetFrequency] = useState(7);
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle(""); setDescription(""); setDueDate(todayStr()); setDueTime("");
    setPriority("medium"); setCategoryId(""); setTargetFrequency(7); setLocation("");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (type === "task") {
        await createTask({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          due_time: dueTime || null,
          priority: priority as "low" | "medium" | "high",
          category_id: categoryId || null,
        });
      } else if (type === "habit") {
        await createHabit({
          name: title.trim(),
          description: description.trim() || null,
          target_frequency: targetFrequency,
        });
      } else if (type === "event") {
        await createEvent({
          title: title.trim(),
          description: description.trim() || null,
          event_date: dueDate,
          start_time: dueTime || null,
          location: location.trim() || null,
          category_id: categoryId || null,
        });
      }
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<string, string> = { task: "Add Task", habit: "Add Habit", event: "Add Event" };

  return (
    <Modal open={open} onClose={onClose} title={titles[type]}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{type === "habit" ? "Habit name" : "Title"}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "habit" ? "e.g. Wake up early" : "e.g. Study chapter 5"}
            autoFocus
          />
        </div>

        {type !== "habit" && (
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
        )}

        {type === "habit" && (
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this habit matters..."
              rows={2}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {type === "task" && (
            <>
              <div>
                <Label>Due date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div>
                <Label>Due time</Label>
                <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
              </div>
            </>
          )}

          {type === "event" && (
            <>
              <div>
                <Label>Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
              </div>
            </>
          )}

          {type === "habit" && (
            <div>
              <Label>Target days per week</Label>
              <Select value={String(targetFrequency)} onChange={(e) => setTargetFrequency(Number(e.target.value))}>
                {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} day{n > 1 ? "s" : ""}</option>)}
              </Select>
            </div>
          )}
        </div>

        {type === "task" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          </div>
        )}

        {type === "event" && (
          <>
            <div>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          </>
        )}

        {error && (
          <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
