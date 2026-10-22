import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Timer as TimerIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { Button, Label, Input } from "@/components/ui";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/context/AuthContext";
import { createFocusSession, formatDuration, todayStr } from "@/lib/api";

type Mode = "focus" | "short_break" | "long_break";

const MODE_CONFIG: Record<Mode, { duration: number; label: string; color: string; icon: typeof Brain }> = {
  focus: { duration: 25 * 60, label: "Focus", color: "#81c9a0", icon: Brain },
  short_break: { duration: 5 * 60, label: "Short Break", color: "#8faebe", icon: Coffee },
  long_break: { duration: 15 * 60, label: "Long Break", color: "#b6a0ed", icon: Coffee },
};

export function FocusPage() {
  const { focusSessions, refresh } = useDashboardData();
  const { appUser } = useAuth();
  const [mode, setMode] = useState<Mode>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useState(MODE_CONFIG.focus.duration);
  const [sessionCount, setSessionCount] = useState(0);
  const [focusTarget, setFocusTarget] = useState(appUser?.focus_target_minutes || 120);
  const endTimestampRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<Mode>("focus");
  const sessionCountRef = useRef(0);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { sessionCountRef.current = sessionCount; }, [sessionCount]);

  const today = todayStr();
  const todayFocusMin = focusSessions
    .filter(s => s.completed_at.startsWith(today) && s.mode === "focus")
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const todaySessions = focusSessions.filter(s => s.completed_at.startsWith(today) && s.mode === "focus").length;

  // Timer tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (endTimestampRef.current === null) return;
      const now = Date.now();
      const diff = Math.round((endTimestampRef.current - now) / 1000);
      if (diff <= 0) {
        setRemaining(0);
        setIsRunning(false);
        endTimestampRef.current = null;
        handleSessionComplete();
      } else {
        setRemaining(diff);
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleSessionComplete = useCallback(async () => {
    const completedMode = modeRef.current;
    const durationMin = Math.round(MODE_CONFIG[completedMode].duration / 60);
    await createFocusSession({
      mode: completedMode,
      duration_minutes: durationMin,
      completed_at: new Date().toISOString(),
    });
    if (completedMode === "focus") {
      setSessionCount(prev => prev + 1);
    }
    refresh();

    // Auto-advance
    if (completedMode === "focus") {
      const next = (sessionCountRef.current + 1) % 4 === 0 ? "long_break" : "short_break";
      setMode(next);
      setRemaining(MODE_CONFIG[next].duration);
    } else {
      setMode("focus");
      setRemaining(MODE_CONFIG.focus.duration);
    }
  }, [refresh]);

  function handleStart() {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      endTimestampRef.current = null;
    } else {
      // Resume or start
      endTimestampRef.current = Date.now() + remaining * 1000;
      setIsRunning(true);
    }
  }

  function handleReset() {
    setIsRunning(false);
    endTimestampRef.current = null;
    setRemaining(MODE_CONFIG[mode].duration);
  }

  function handleSkip() {
    setIsRunning(false);
    endTimestampRef.current = null;
    handleSessionComplete();
  }

  function switchMode(newMode: Mode) {
    setIsRunning(false);
    endTimestampRef.current = null;
    setMode(newMode);
    setRemaining(MODE_CONFIG[newMode].duration);
  }

  async function handleSaveTarget() {
    // Could save to profile - for now just update local
    setFocusTarget(focusTarget);
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const totalSeconds = MODE_CONFIG[mode].duration;
  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
  const config = MODE_CONFIG[mode];
  const ModeIcon = config.icon;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Focus Timer</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timer */}
        <Card className="lg:col-span-2 p-6 flex flex-col items-center">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-8 p-1 bg-bg-input rounded-lg">
            {(Object.keys(MODE_CONFIG) as Mode[]).map(m => {
              const MIcon = MODE_CONFIG[m].icon;
              return (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    mode === m ? "bg-bg-card text-text-primary" : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  <MIcon size={13} />
                  {MODE_CONFIG[m].label}
                </button>
              );
            })}
          </div>

          {/* Circular timer */}
          <div className="relative w-64 h-64 mb-8">
            <svg className="w-64 h-64 -rotate-90" viewBox="0 0 256 256">
              <circle cx="128" cy="128" r="120" fill="none" stroke="#1d272e" strokeWidth="6" />
              <circle
                cx="128" cy="128" r="120" fill="none" stroke={config.color} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-2">
                <ModeIcon size={18} style={{ color: config.color }} />
                <span className="text-xs text-text-muted uppercase tracking-wider">{config.label}</span>
              </div>
              <span className="text-5xl font-bold text-text-primary tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-xs text-text-muted mt-2">
                Session {sessionCount + 1}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="w-11 h-11 rounded-full bg-bg-input border border-border-primary text-text-muted hover:text-text-primary transition-colors flex items-center justify-center"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={handleStart}
              className="w-14 h-14 rounded-full flex items-center justify-center text-bg-primary font-medium transition-all hover:scale-105"
              style={{ background: config.color }}
            >
              {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>
            <button
              onClick={handleSkip}
              className="w-11 h-11 rounded-full bg-bg-input border border-border-primary text-text-muted hover:text-text-primary transition-colors flex items-center justify-center"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TimerIcon size={14} className="text-accent-orange" />
              <h3 className="text-sm font-semibold text-text-primary">Today's Focus</h3>
            </div>
            <p className="text-3xl font-bold text-text-primary">{formatDuration(todayFocusMin)}</p>
            <p className="text-xs text-text-muted mt-1">of {formatDuration(focusTarget)} target</p>
            <div className="h-1.5 bg-bg-input rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-accent-orange rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayFocusMin / focusTarget) * 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="text-center p-2 rounded-lg bg-bg-input">
                <p className="text-lg font-bold text-text-primary">{todaySessions}</p>
                <p className="text-[10px] text-text-muted">Sessions</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-bg-input">
                <p className="text-lg font-bold text-text-primary">{sessionCount}</p>
                <p className="text-[10px] text-text-muted">This round</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Daily Target</h3>
            <Label>Focus target (minutes)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={focusTarget}
                onChange={(e) => setFocusTarget(Number(e.target.value) || 120)}
                min={15}
                max={600}
              />
              <Button size="sm" variant="secondary" onClick={handleSaveTarget}>Set</Button>
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              Set how many focus minutes you want to reach each day.
            </p>
          </Card>

          {/* Recent sessions */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Recent Sessions</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {focusSessions.slice(0, 10).map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-bg-cardHover transition-colors">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: MODE_CONFIG[s.mode as Mode]?.color }} />
                    <span className="text-text-secondary">{MODE_CONFIG[s.mode as Mode]?.label || s.mode}</span>
                  </span>
                  <span className="text-text-muted">{formatDuration(s.duration_minutes)}</span>
                </div>
              ))}
              {focusSessions.length === 0 && (
                <p className="text-xs text-text-muted text-center py-4">No sessions yet. Start focusing!</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
