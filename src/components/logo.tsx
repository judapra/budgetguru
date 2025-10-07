// src/components/logo.tsx
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
        <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Budget Guru Logo"
        >
            <path d="M20 0L40 20H0L20 0Z" fill="currentColor" className="text-foreground/80" />
            <path d="M20 40L40 20H0L20 40Z" fill="currentColor" className="text-primary" />
            <path d="M30 20L20 30L10 20H30Z" fill="currentColor" className="text-background" />
        </svg>
      <span className="font-headline text-xl font-bold">Budget Guru</span>
    </div>
  );
}
