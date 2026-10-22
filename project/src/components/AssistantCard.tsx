import { useState, type FormEvent } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/Card";
import type { Task, Habit, Event, FocusSession } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AssistantCardProps {
  tasks: Task[];
  habits: Habit[];
  events: Event[];
  focusSessions: FocusSession[];
}

const EXAMPLE_PROMPTS = [
  "Plan my day for studying and gym",
  "Help me set weekly goals",
  "Suggest a better sleep schedule",
  "Create a study timetable",
  "Help me organize my projects",
];

function generateResponse(prompt: string, tasks: Task[], habits: Habit[], events: Event[], focusSessions: FocusSession[]): string {
  const p = prompt.toLowerCase();
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => t.due_date === todayStr);
  const incompleteTasks = todayTasks.filter(t => !t.completed);
  const activeHabits = habits.filter(h => h.active);
  const todayFocusMin = focusSessions
    .filter(s => s.completed_at.startsWith(todayStr) && s.mode === "focus")
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  if (p.includes("plan") && (p.includes("day") || p.includes("study") || p.includes("gym"))) {
    let plan = "Here's a suggested plan for your day:\n\n";
    if (incompleteTasks.length > 0) {
      plan += "**Priority tasks:**\n";
      incompleteTasks.slice(0, 5).forEach((t, i) => {
        plan += `${i+1}. ${t.title}${t.due_time ? ` (due ${t.due_time})` : ""}\n`;
      });
      plan += "\n";
    }
    plan += "**Suggested schedule:**\n";
    plan += "• Morning (7:00-9:00): Deep focus session + study\n";
    plan += "• Mid-morning (9:00-10:00): Review tasks & plan\n";
    plan += "• Afternoon (14:00-16:00): Second focus block\n";
    plan += "• Late afternoon (17:00-18:00): Gym/workout\n";
    plan += "• Evening (20:00-21:00): Light review & habit check-in\n\n";
    if (activeHabits.length > 0) {
      plan += `**Habits to track:** ${activeHabits.map(h => h.name).join(", ")}\n\n`;
    }
    plan += `**Focus time today:** ${todayFocusMin} minutes logged.\n\n`;
    plan += "This is a rule-based suggestion. Stay disciplined!";
    return plan;
  }

  if (p.includes("goal") || p.includes("weekly")) {
    return `Here are some weekly goal suggestions based on your current data:\n\n` +
      `1. Complete all ${incompleteTasks.length} pending task${incompleteTasks.length !== 1 ? "s" : ""} for today\n` +
      `2. Log ${activeHabits.length} habit${activeHabits.length !== 1 ? "s" : ""} daily (${activeHabits.map(h => h.name).join(", ") || "none set up yet"})\n` +
      `3. Accumulate at least 150 minutes of focus time this week\n` +
      `4. Aim for 5+ focus sessions per day\n` +
      `5. Review your analytics at week's end to spot patterns\n\n` +
      `You've logged ${todayFocusMin} focus minutes today. Keep going!`;
  }

  if (p.includes("sleep")) {
    return "Here's a sleep optimization plan:\n\n" +
      "1. **Set a consistent bedtime** — aim for the same time every night (e.g., 22:30)\n" +
      "2. **Wind down 30 minutes before** — no screens, dim lights\n" +
      "3. **Avoid caffeine after 14:00**\n" +
      "4. **Morning sunlight** — get natural light within 30 min of waking\n" +
      "5. **Track it** — add a 'Good sleep' habit to monitor consistency\n\n" +
      "Create a 'Sleep' habit in your habit tracker to start logging.";
  }

  if (p.includes("timetable") || p.includes("schedule") || p.includes("study")) {
    let tt = "Here's a study timetable template:\n\n";
    tt += "**Mon-Fri:**\n";
    tt += "• 07:00-08:00 — Morning review (light reading)\n";
    tt += "• 09:00-11:00 — Deep study block 1 (hardest subject)\n";
    tt += "• 14:00-16:00 — Deep study block 2\n";
    tt += "• 19:00-20:00 — Practice problems / revision\n\n";
    tt += "**Weekend:**\n";
    tt += "• 10:00-12:00 — Weekly review & planning\n";
    tt += "• 15:00-17:00 — Light catch-up\n\n";
    if (incompleteTasks.length > 0) {
      tt += `You have ${incompleteTasks.length} task${incompleteTasks.length !== 1 ? "s" : ""} due today. Consider scheduling the most important one in your next focus block.`;
    }
    return tt;
  }

  if (p.includes("project") || p.includes("organize")) {
    const projectCats = ["Personal Projects", "Work", "Study"];
    let res = "Here's how to organize your projects:\n\n";
    res += "1. **Break down** each project into small tasks (15-30 min each)\n";
    res += "2. **Prioritize** using High/Medium/Low labels\n";
    res += "3. **Schedule** 1-2 focus sessions per project daily\n";
    res += "4. **Review** progress at the end of each week\n\n";
    const projectTasks = tasks.filter(t => projectCats.some(c => t.title.toLowerCase().includes(c.toLowerCase())));
    if (projectTasks.length > 0) {
      res += `You currently have ${projectTasks.length} project-related task${projectTasks.length !== 1 ? "s" : ""}.\n`;
    }
    return res;
  }

  return `I can help you with planning, goals, sleep, study schedules, and project organization. ` +
    `Based on your current data: ${incompleteTasks.length} pending task${incompleteTasks.length !== 1 ? "s" : ""}, ` +
    `${activeHabits.length} active habit${activeHabits.length !== 1 ? "s" : ""}, and ${todayFocusMin} focus minutes today. ` +
    `Try one of the example prompts above for specific suggestions.\n\n` +
    `Note: This is a local rule-based assistant, not an external AI model.`;
}

export function AssistantCard({ tasks, habits, events, focusSessions }: AssistantCardProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your NOIRFLOW assistant. Tell me your goals, available time, or ask for a plan. I can suggest schedules, study plans, and productivity tips based on your data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response = generateResponse(userMsg, tasks, habits, events, focusSessions);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 400);
  }

  function usePrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <Card className="flex flex-col h-[400px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-primary">
        <div className="w-6 h-6 rounded-lg bg-accent-purple/15 flex items-center justify-center">
          <Bot size={14} className="text-accent-purple" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">AI Assistant</h3>
        <span className="ml-auto text-[10px] text-text-muted px-1.5 py-0.5 bg-bg-input rounded">Local</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                msg.role === "user"
                  ? "max-w-[85%] bg-accent-green/15 text-text-primary text-xs rounded-lg rounded-tr-sm px-3 py-2 whitespace-pre-wrap"
                  : "max-w-[85%] bg-bg-cardHover text-text-secondary text-xs rounded-lg rounded-tl-sm px-3 py-2 whitespace-pre-wrap"
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-cardHover text-text-muted text-xs rounded-lg rounded-tl-sm px-3 py-2">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: "200ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: "400ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => usePrompt(prompt)}
              className="text-[10px] text-text-muted bg-bg-input border border-border-primary rounded-full px-2 py-1 hover:text-text-secondary hover:border-border-secondary transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-border-primary">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me your goals, available time or ask for a plan..."
            className="flex-1 bg-bg-input border border-border-primary rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-secondary transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-accent-green/15 text-accent-green rounded-lg hover:bg-accent-green/25 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </Card>
  );
}
