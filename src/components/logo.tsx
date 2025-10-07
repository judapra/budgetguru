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
            <defs>
                <linearGradient id="logo-gradient" x1="0" y1="20" x2="40" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="hsl(var(--primary))" />
                    <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.5"/>
                </linearGradient>
            </defs>
            <path 
                d="M23.6,26.1l-6.5,3.8c-0.3,0.2-0.7,0.2-1,0L5.9,24.1c-0.3-0.2-0.5-0.5-0.5-0.9V16.3c0-0.4,0.2-0.7,0.5-0.9l10.2-5.8c0.3-0.2,0.7-0.2,1,0l10.2,5.8c0.3,0.2,0.5,0.5,0.5,0.9v0.5h-2.1v-0.3c0-0.1-0.1-0.2-0.2-0.3l-9.9-5.7c-0.1-0.1-0.2-0.1-0.3,0L6.4,15.9c-0.1,0.1-0.2,0.2-0.2,0.3v7.3c0,0.1,0.1,0.2,0.2,0.3L16,28.8c0.1,0.1,0.2,0.1,0.3,0l6.5-3.8c0.1-0.1,0.2-0.2,0.2-0.3v-2.3h2.1V26.1z" 
                fill="url(#logo-gradient)" 
            />
            <path 
                d="M34.1,15.9L23.9,10c-0.3-0.2-0.7-0.2-1,0l-3.2,1.8h2.1l2.9-1.7c0.1-0.1,0.2-0.1,0.3,0l9.9,5.7c0.1,0.1,0.2,0.2,0.2,0.3v7.3c0,0.1-0.1,0.2-0.2,0.3l-7.3,4.2v-2.1l7-4c0.1-0.1,0.2-0.2,0.2-0.3V16.3C34.6,16.2,34.4,15.9,34.1,15.9z" 
                fill="url(#logo-gradient)" 
            />
            <path 
                d="M29.9,20.1l-6.5-3.8c-0.3-0.2-0.7-0.2-1,0l-6.5,3.8c-0.3,0.2-0.5,0.5-0.5,0.9v7.7c0,0.4,0.2,0.7,0.5,0.9l6.5,3.8c0.3,0.2,0.7,0.2,1,0l6.5-3.8c0.3-0.2,0.5-0.5,0.5-0.9v-7.7C30.4,20.6,30.2,20.3,29.9,20.1z M28.3,28.2c0,0.1-0.1,0.2-0.2,0.3l-6.2,3.6c-0.1,0.1-0.2,0.1-0.3,0l-6.2-3.6c-0.1-0.1-0.2-0.2-0.2-0.3v-7.1c0-0.1,0.1-0.2,0.2-0.3l6.2-3.6c0.1-0.1,0.2-0.1,0.3,0l6.2,3.6c0.1,0.1,0.2,0.2,0.2,0.3V28.2z" 
                fill="url(#logo-gradient)" 
            />
        </svg>
      <span className="font-headline text-xl font-bold">Budget Guru</span>
    </div>
  );
}
