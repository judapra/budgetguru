import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image 
        src="/logo.svg" 
        alt="Budget Guru Logo" 
        width={40} 
        height={40}
      />
      <span className="font-headline text-xl font-bold">Budget Guru</span>
    </div>
  );
}
