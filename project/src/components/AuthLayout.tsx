import { type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Quote } from "@/components/Quote";

export function AuthLayout({ children, side = "left" }: { children: ReactNode; side?: "left" | "right" }) {
  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 border-r border-border-primary">
        <Logo />
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-text-primary leading-tight">
            Your life,<br />
            <span className="text-accent-green">in focus.</span>
          </h1>
          <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
            Manage tasks, build habits, track focus time, and organize every area
            of your life in one calm, premium dashboard.
          </p>
          <div className="space-y-3 pt-4">
            {[
              { label: "Task management with priorities & categories" },
              { label: "Habit tracking with streaks and weekly stats" },
              { label: "Focus timer with Pomodoro sessions" },
              { label: "Analytics to visualize your productivity" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-text-muted italic max-w-xs">
          "Discipline today builds the freedom you want tomorrow."
        </p>
      </div>

      {/* Form panel */}
      <div className={`flex-1 flex items-center justify-center p-6 ${side === "right" ? "lg:order-first" : ""}`}>
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
