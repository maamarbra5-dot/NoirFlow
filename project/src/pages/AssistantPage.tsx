import { useState, type FormEvent } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/Card";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { Task, Habit, Event, FocusSession } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
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
    return `Here are some weekly goal suggestions:\n\n` +
      `1. Complete all ${incompleteTasks.length} pending task${incompleteTasks.length !== 1 ? "s" : ""} for today\n` +
      `2. Log ${activeHabits.length} habit${activeHabits.length !== 1 ? "s" : ""} daily\n` +
      `3. Accumulate at least 150 minutes of focus time this week\n` +
      `4. Aim for 5+ focus sessions per day\n` +
      `5. Review your analytics at week's end\n\n` +
      `You've logged ${todayFocusMin} focus minutes today.`;
  }

  if (p.includes("sleep")) {
    return "Here's a sleep optimization plan:\n\n" +
      "1. Set a consistent bedtime — aim for the same time every night (e.g., 22:30)\n" +
      "2. Wind down 30 minutes before — no screens, dim lights\n" +
      "3. Avoid caffeine after 14:00\n" +
      "4. Morning sunlight — get natural light within 30 min of waking\n" +
      "5. Track it — add a 'Good sleep' habit to monitor consistency\n\n" +
      "Create a 'Sleep' habit in your habit tracker to start logging.";
  }

  if (p.includes("timetable") || p.includes("schedule")) {
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
      tt += `You have ${incompleteTasks.length} task${incompleteTasks.length !== 1 ? "s" : ""} due today.`;
    }
    return tt;
  }

  if (p.includes("project") || p.includes("organize")) {
    return "Here's how to organize your projects:\n\n" +
      "1. Break down each project into small tasks (15-30 min each)\n" +
      "2. Prioritize using High/Medium/Low labels\n" +
      "3. Schedule 1-2 focus sessions per project daily\n" +
      "4. Review progress at the end of each week\n\n" +
      `You currently have ${tasks.length} total task${tasks.length !== 1 ? "s" : ""}.`;
  }

  return `I can help you with planning, goals, sleep, study schedules, and project organization. ` +
    `You have ${incompleteTasks.length} pending task${incompleteTasks.length !== 1 ? "s" : ""}, ` +
    `${activeHabits.length} active habit${activeHabits.length !== 1 ? "s" : ""}, and ${todayFocusMin} focus minutes today.\n\n` +
    `Note: This is a local rule-based assistant, not an external AI model.`;
}

export function AssistantPage() {
  const { tasks, habits, events, focusSessions } = useDashboardData();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your NOIRFLOW assistant. I can help you plan your day, set goals, create study schedules, and suggest productivity improvements. Ask me anything!",
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
    }, 500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/15 flex items-center justify-center">
          <Bot size={20} className="text-accent-purple" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">AI Assistant</h1>
          <p className="text-xs text-text-muted">Local rule-based assistant · No external API required</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chat */}
        <Card className="lg:col-span-3 flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={msg.role === "user" ? "max-w-[80%]" : "max-w-[80%]"}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-accent-purple/15 flex items-center justify-center">
                        <Bot size={13} className="text-accent-purple" />
                      </div>
                      <span className="text-[11px] text-text-muted">Assistant</span>
                    </div>
                  )}
                  <div
                    className={
                      msg.role === "user"
                        ? "bg-accent-green/15 text-text-primary text-sm rounded-lg rounded-tr-sm px-4 py-2.5 whitespace-pre-wrap"
                        : "bg-bg-cardHover text-text-secondary text-sm rounded-lg rounded-tl-sm px-4 py-2.5 whitespace-pre-wrap"
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-bg-cardHover text-text-muted text-sm rounded-lg rounded-tl-sm px-4 py-3">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: "200ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: "400ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border-primary">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me your goals, available time or ask for a plan..."
                className="flex-1 bg-bg-input border border-border-primary rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-secondary transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 flex items-center justify-center bg-accent-green/15 text-accent-green rounded-lg hover:bg-accent-green/25 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </Card>

        {/* Example prompts sidebar */}
        <Card className="p-4 h-fit">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-accent-purple" />
            <h3 className="text-sm font-semibold text-text-primary">Example Prompts</h3>
          </div>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt)}
                className="w-full text-left text-xs text-text-secondary bg-bg-input border border-border-primary rounded-lg px-3 py-2.5 hover:border-border-secondary hover:text-text-primary transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-bg-input border border-border-primary">
            <p className="text-[11px] text-text-muted leading-relaxed">
              This assistant uses a built-in rule-based engine that analyzes your tasks, habits, and focus data to generate personalized suggestions. No external AI API is required.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
