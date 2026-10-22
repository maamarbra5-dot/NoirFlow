import { useState, useMemo, type FormEvent } from "react";
import { Plus, Trash2, Flag, Edit2 } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Input, Textarea, Button, Label, Select } from "@/components/ui";
import { useDashboardData } from "@/hooks/useDashboardData";
import { createTask, updateTask, deleteTask, formatDate, formatTime, todayStr } from "@/lib/api";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import type { Task } from "@/lib/types";

type SortBy = "dueDate" | "priority" | "created";
type Filter = "all" | "today" | "important" | "completed";

export function TasksPage() {
  const { tasks, categories, refresh } = useDashboardData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("created");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [important, setImportant] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    let result = [...tasks];
    const today = todayStr();
    if (filter === "today") result = result.filter(t => t.due_date === today);
    if (filter === "important") result = result.filter(t => t.important);
    if (filter === "completed") result = result.filter(t => t.completed);
    else if (filter === "all") result = result.filter(t => !t.completed);

    if (sortBy === "dueDate") result.sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
    if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    }
    if (sortBy === "created") result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return result;
  }, [tasks, filter, sortBy]);

  function openAdd() {
    setEditTask(null);
    setTitle(""); setDescription(""); setDueDate(todayStr()); setDueTime("");
    setPriority("medium"); setImportant(false); setCategoryId("");
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.due_date || todayStr());
    setDueTime(task.due_time || "");
    setPriority(task.priority);
    setImportant(task.important);
    setCategoryId(task.category_id || "");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, {
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          due_time: dueTime || null,
          priority: priority as "low" | "medium" | "high",
          important,
          category_id: categoryId || null,
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          due_time: dueTime || null,
          priority: priority as "low" | "medium" | "high",
          important,
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

  async function handleToggle(task: Task) {
    await updateTask(task.id, { completed: !task.completed });
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    setModalOpen(false);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-text-primary">Tasks</h1>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="text-xs w-32">
            <option value="created">Newest</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
          </Select>
          <Button size="sm" onClick={openAdd}><Plus size={14} /> Add Task</Button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {(["all", "today", "important", "completed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
              filter === f ? "bg-bg-cardHover text-text-primary border border-border-secondary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-text-muted">No tasks found.</p>
              <Button size="sm" variant="secondary" onClick={openAdd} className="mt-3"><Plus size={14} /> Create your first task</Button>
            </div>
          ) : (
            filtered.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-cardHover transition-colors group">
                <input type="checkbox" checked={task.completed} onChange={() => handleToggle(task)} className="noir-checkbox" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.completed ? "line-through text-text-muted" : "text-text-primary"}`}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.due_date && <span className="text-[10px] text-text-muted">{formatDate(task.due_date)} {formatTime(task.due_time)}</span>}
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: PRIORITY_COLORS[task.priority] }}>
                      <Flag size={9} /> {PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.important && <span className="text-[10px] text-accent-orange">Important</span>}
                    {task.category_id && categories.find(c => c.id === task.category_id) && (
                      <span className="text-[10px] text-text-muted bg-bg-input rounded px-1.5 py-0.5">
                        {categories.find(c => c.id === task.category_id)?.name}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => openEdit(task)} className="text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(task.id)} className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? "Edit Task" : "Add Task"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" autoFocus />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Due time</Label>
              <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} className="noir-checkbox" />
            <span className="text-xs text-text-secondary">Mark as important</span>
          </label>
          <div className="flex gap-2 pt-1">
            {editTask && (
              <Button type="button" variant="danger" onClick={() => handleDelete(editTask.id)} className="mr-auto">
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
