import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, BookOpen, Briefcase, Dumbbell, Utensils, Droplets, Moon, Rocket, MoreHorizontal } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatDate } from "@/lib/api";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/constants";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  Study: BookOpen,
  Work: Briefcase,
  "Gym & Fitness": Dumbbell,
  Gym: Dumbbell,
  "Meals & Nutrition": Utensils,
  Meals: Utensils,
  Water: Droplets,
  Sleep: Moon,
  "Personal Projects": Rocket,
  Projects: Rocket,
};

const CATEGORY_COLORS: Record<string, string> = {
  Study: "#8faebe",
  Work: "#b6a0ed",
  "Gym & Fitness": "#e17c7c",
  Gym: "#e17c7c",
  "Meals & Nutrition": "#e8a06b",
  Meals: "#e8a06b",
  Water: "#8faebe",
  Sleep: "#b6a0ed",
  "Personal Projects": "#81c9a0",
  Projects: "#81c9a0",
};

export function CategoriesPage() {
  const { tasks, habits, events, categories } = useDashboardData();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("name");

  const allCategories = useMemo(() => {
    const cats = categories.map(c => c.name);
    const defaults = ["Study", "Work", "Gym & Fitness", "Meals & Nutrition", "Water", "Sleep", "Personal Projects"];
    return [...new Set([...cats, ...defaults])];
  }, [categories]);

  if (selectedCategory) {
    const categoryName = selectedCategory;
    const color = CATEGORY_COLORS[categoryName] || "#81c9a0";
    const Icon = CATEGORY_ICONS[categoryName] || MoreHorizontal;
    const category = categories.find(c => c.name === categoryName);

    const categoryTasks = tasks.filter(t => t.category_id === category?.id);
    const categoryHabits = habits.filter(h => h.name.toLowerCase().includes(categoryName.toLowerCase()));
    const categoryEvents = events.filter(e => e.category_id === category?.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchParams({})}
            className="text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            ← All categories
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon size={22} style={{ color }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{categoryName}</h1>
            <p className="text-xs text-text-muted">
              {categoryTasks.length} tasks · {categoryHabits.length} habits · {categoryEvents.length} events
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader title="Tasks" icon={<Plus size={14} />} />
            <div className="p-3 space-y-1.5 max-h-[300px] overflow-y-auto">
              {categoryTasks.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">No tasks in this category.</p>
              ) : categoryTasks.map(t => (
                <div key={t.id} className="px-2 py-2 rounded-lg hover:bg-bg-cardHover transition-colors">
                  <p className={`text-sm ${t.completed ? "line-through text-text-muted" : "text-text-primary"}`}>{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.due_date && <span className="text-[10px] text-text-muted">{formatDate(t.due_date)}</span>}
                    <span className="text-[10px]" style={{ color: PRIORITY_COLORS[t.priority] }}>{PRIORITY_LABELS[t.priority]}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Habits" icon={<Plus size={14} />} />
            <div className="p-3 space-y-1.5 max-h-[300px] overflow-y-auto">
              {categoryHabits.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">No habits in this category.</p>
              ) : categoryHabits.map(h => (
                <div key={h.id} className="px-2 py-2 rounded-lg hover:bg-bg-cardHover transition-colors">
                  <p className="text-sm text-text-primary">{h.name}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{h.target_frequency} days/week</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Events" icon={<Plus size={14} />} />
            <div className="p-3 space-y-1.5 max-h-[300px] overflow-y-auto">
              {categoryEvents.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">No events in this category.</p>
              ) : categoryEvents.map(e => (
                <div key={e.id} className="px-2 py-2 rounded-lg hover:bg-bg-cardHover transition-colors">
                  <p className="text-sm text-text-primary">{e.title}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{formatDate(e.event_date)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Life Categories</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allCategories.map(catName => {
          const color = CATEGORY_COLORS[catName] || "#81c9a0";
          const Icon = CATEGORY_ICONS[catName] || MoreHorizontal;
          const category = categories.find(c => c.name === catName);
          const taskCount = tasks.filter(t => t.category_id === category?.id).length;
          const eventCount = events.filter(e => e.category_id === category?.id).length;
          const total = taskCount + eventCount;

          return (
            <Card key={catName} hover className="p-4 cursor-pointer" >
              <button
                onClick={() => setSearchParams({ name: catName })}
                className="w-full text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{catName}</p>
                    <p className="text-[11px] text-text-muted">{total} item{total !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="h-1 bg-bg-input rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, total * 10)}%`, background: color }} />
                </div>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
