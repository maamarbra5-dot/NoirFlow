import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-bg-input border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary",
        "placeholder:text-text-muted focus:outline-none focus:border-border-secondary transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-bg-input border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary",
        "placeholder:text-text-muted focus:outline-none focus:border-border-secondary transition-colors resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full bg-bg-input border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary",
        "focus:outline-none focus:border-border-secondary transition-colors cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-accent-green/90 text-bg-primary hover:bg-accent-green font-medium",
    secondary: "bg-bg-cardHover text-text-primary border border-border-primary hover:border-border-secondary",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-bg-cardHover",
    danger: "bg-accent-red/15 text-accent-red hover:bg-accent-red/25 border border-accent-red/30",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={cn("block text-xs font-medium text-text-secondary mb-1.5", className)}>
      {children}
    </label>
  );
}

import type { ReactNode } from "react";
