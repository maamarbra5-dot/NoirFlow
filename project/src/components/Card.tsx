import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-bg-card border border-border-primary rounded-xl",
        hover && "hover:border-border-secondary transition-colors duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, icon, action }: { title: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
      <div className="flex items-center gap-2">
        {icon && <span className="text-text-muted">{icon}</span>}
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {action}
    </div>
  );
}
