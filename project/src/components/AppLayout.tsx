import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useDashboardData } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  rightColumn?: ReactNode;
}

export function AppLayout({ children, rightColumn }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { tasks, events, habits } = useDashboardData();
  const location = useLocation();

  // Determine if right column should show (only on dashboard)
  const showRightColumn = location.pathname === "/" && rightColumn;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden absolute left-3 top-3 z-30 text-text-muted hover:text-text-primary"
        >
          <Menu size={20} />
        </button>

        <Header tasks={tasks} events={events} habits={habits} />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className={cn("p-5", showRightColumn ? "lg:mr-[260px]" : "")}>
              {children}
            </div>
          </main>

          {showRightColumn && (
            <aside className="hidden lg:block w-[260px] flex-shrink-0 border-l border-border-primary overflow-y-auto p-3 space-y-3">
              {rightColumn}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
