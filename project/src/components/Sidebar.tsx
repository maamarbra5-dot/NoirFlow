import { useState, useRef, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, ListTodo, Repeat, Timer,
  Layers, Bot, BarChart3, Settings,
  ChevronLeft, ChevronRight, Menu, X, Search, Bell,
  LogOut, User as UserIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Quote } from "@/components/Quote";
import { useAuth } from "@/context/AuthContext";
import { getGreeting } from "@/lib/auth";
import { getInitials, cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/focus", label: "Focus Timer", icon: Timer },
  { to: "/categories", label: "Life Categories", icon: Layers },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

const CATEGORY_LINKS = [
  { name: "Study", icon: "BookOpen" },
  { name: "Work", icon: "Briefcase" },
  { name: "Gym & Fitness", icon: "Dumbbell" },
  { name: "Meals & Nutrition", icon: "Utensils" },
  { name: "Water", icon: "Droplets" },
  { name: "Sleep", icon: "Moon" },
  { name: "Personal Projects", icon: "Rocket" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  function handleNavClick(to: string) {
    navigate(to);
    onCloseMobile();
  }

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("px-4 py-4 flex items-center", collapsed && !mobileOpen && "justify-center")}>
        {collapsed && !mobileOpen ? (
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
            <path d="M6 22V6L22 22V6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <Logo />
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to;
          return (
            <button
              key={link.to}
              onClick={() => handleNavClick(link.to)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 relative group",
                collapsed && !mobileOpen && "justify-center",
                active
                  ? "text-text-primary bg-bg-cardHover"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              )}
              title={collapsed && !mobileOpen ? link.label : undefined}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-green rounded-full" />
              )}
              <Icon size={17} className="flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span className="truncate">{link.label}</span>}
            </button>
          );
        })}

        {/* Divider + Life Categories */}
        {(!collapsed || mobileOpen) && (
          <>
            <div className="h-px bg-border-primary my-3" />
            <p className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
              Life Categories
            </p>
          </>
        )}

        {CATEGORY_LINKS.map((cat) => {
          return (
            <button
              key={cat.name}
              onClick={() => handleNavClick(`/categories?name=${encodeURIComponent(cat.name)}`)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                "text-text-secondary hover:text-text-primary hover:bg-bg-card/50",
                collapsed && !mobileOpen && "justify-center"
              )}
              title={collapsed && !mobileOpen ? cat.name : undefined}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span className="truncate text-xs">{cat.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Settings + Quote + Sign out */}
      <div className="px-2 py-3 border-t border-border-primary space-y-2">
        <button
          onClick={() => handleNavClick("/settings")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            location.pathname === "/settings"
              ? "text-text-primary bg-bg-cardHover"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50",
            collapsed && !mobileOpen && "justify-center"
          )}
          title={collapsed && !mobileOpen ? "Settings" : undefined}
        >
          <Settings size={17} className="flex-shrink-0" />
          {(!collapsed || mobileOpen) && <span>Settings</span>}
        </button>

        {(!collapsed || mobileOpen) && (
          <div className="px-3 py-2">
            <Quote className="block leading-relaxed" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-bg-sidebar border-r border-border-primary transition-all duration-200 flex-shrink-0",
          collapsed ? "w-[60px]" : "w-[254px]"
        )}
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-bg-card border border-border-primary rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative w-[254px] bg-bg-sidebar border-r border-border-primary animate-slide-in-left">
            <button
              onClick={onCloseMobile}
              className="absolute top-4 right-3 text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
