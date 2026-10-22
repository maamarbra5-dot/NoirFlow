import { QUOTE } from "@/lib/constants";

export function Quote({ className }: { className?: string }) {
  return (
    <p className={`text-xs text-text-muted italic ${className || ""}`}>
      "{QUOTE}"
    </p>
  );
}
