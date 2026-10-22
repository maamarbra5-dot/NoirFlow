import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        className="flex-shrink-0"
      >
        <path
          d="M6 22V6L22 22V6"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-wider text-text-primary">
          NOIRFLOW
        </span>
        <span className="text-[9px] tracking-[0.15em] text-text-muted mt-0.5">
          YOUR LIFE. IN FOCUS.
        </span>
      </div>
    </div>
  );
}
