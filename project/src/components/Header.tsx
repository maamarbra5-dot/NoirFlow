import { useState, useRef, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, LogOut, Settings, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getGreeting } from "@/lib/auth";
import { getInitials, cn } from "@/lib/utils";
import type { Task, Event, Habit } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/api";

interface HeaderProps {
  tasks: Task[];
  events: Event[];
  habits: Habit[];
}

export function Header({ tasks, events, habits }: HeaderProps) {
  const { appUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; subtitle: string; link: string }[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = appUser?.display_name || appUser?.email?.split("@")[0] || "User";
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setBellOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [searchOpen]);

  // Click outside for bell & menu
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: { type: string; title: string; subtitle: string; link: string }[] = [];
    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q)) {
        results.push({ type: "Task", title: t.title, subtitle: formatDate(t.due_date), link: "/tasks" });
      }
    });
    events.forEach((e) => {
      if (e.title.toLowerCase().includes(q)) {
        results.push({ type: "Event", title: e.title, subtitle: `${formatDate(e.event_date)} ${formatTime(e.start_time)}`, link: "/calendar" });
      }
    });
    habits.forEach((h) => {
      if (h.name.toLowerCase().includes(q)) {
        results.push({ type: "Habit", title: h.name, subtitle: "Habit", link: "/habits" });
      }
    });
    setSearchResults(results.slice(0, 8));
  }, [searchQuery, tasks, events, habits]);

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  // Notifications: upcoming events + overdue tasks
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter((e) => e.event_date >= todayStr).slice(0, 5);
  const overdueTasks = tasks.filter((t) => !t.completed && t.due_date && t.due_date < todayStr).slice(0, 5);
  const notifications = [
    ...upcomingEvents.map((e) => ({ title: e.title, subtitle: `Event · ${formatDate(e.event_date)}`, type: "event" })),
    ...overdueTasks.map((t) => ({ title: t.title, subtitle: `Overdue · ${formatDate(t.due_date)}`, type: "task" })),
  ];

  return (
    <>
      <header className="h-[72px] flex items-center justify-between px-5 border-b border-border-primary bg-bg-primary flex-shrink-0">
        {/* Left: greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-text-primary truncate">
              {greeting}, {displayName}
            </p>
            <p className="text-xs text-text-muted">{today}</p>
          </div>
        </div>

        {/* Right: search, bell, avatar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 bg-bg-card border border-border-primary rounded-lg px-3 py-1.5 text-xs text-text-muted hover:border-border-secondary transition-colors w-56"
          >
            <Search size={14} />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-bg-input rounded border border-border-primary text-text-muted">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden text-text-muted hover:text-text-primary transition-colors"
          >
            <Search size={18} />
          </button>

          {/* Bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative text-text-muted hover:text-text-primary transition-colors p-1.5"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-accent-orange rounded-full" />
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-bg-card border border-border-primary rounded-xl shadow-2xl animate-scale-in overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border-primary">
                  <p className="text-sm font-semibold text-text-primary">Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={20} className="text-text-muted mx-auto mb-2" />
                      <p className="text-xs text-text-muted">You're all caught up.</p>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="px-4 py-2.5 hover:bg-bg-cardHover transition-colors border-b border-border-primary/50 last:border-0">
                        <p className="text-xs font-medium text-text-primary truncate">{n.title}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{n.subtitle}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar + menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-bg-card rounded-lg p-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent-green/15 border border-accent-green/30 flex items-center justify-center text-xs font-semibold text-accent-green">
                {getInitials(displayName)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-text-primary leading-none">{displayName}</p>
                <p className="text-[10px] text-text-muted mt-0.5">Account</p>
              </div>
              <ChevronDown size={14} className="text-text-muted hidden sm:block" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-border-primary rounded-xl shadow-2xl animate-scale-in overflow-hidden z-50">
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-cardHover transition-colors"
                >
                  <UserIcon size={15} /> Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-cardHover transition-colors"
                >
                  <Settings size={15} /> Settings
                </Link>
                <div className="h-px bg-border-primary" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg bg-bg-card border border-border-primary rounded-xl shadow-2xl animate-scale-in overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-primary">
              <Search size={18} className="text-text-muted" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, events, habits..."
                className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 bg-bg-input rounded border border-border-primary text-text-muted">
                Esc
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searchQuery.trim() === "" ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-text-muted">Search across your tasks, events, and habits.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-text-muted">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                searchResults.map((result, i) => (
                  <Link
                    key={i}
                    to={result.link}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-cardHover transition-colors border-b border-border-primary/50 last:border-0"
                  >
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-input text-text-muted uppercase tracking-wide">
                      {result.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{result.title}</p>
                      <p className="text-[11px] text-text-muted">{result.subtitle}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
