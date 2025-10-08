
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className, large = false }: { className?: string, large?: boolean }) {
  const size = large ? 150 : 80;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Image 
        src="/logo.svg" 
        alt="Budget Guru Logo" 
        width={size} 
        height={size}
      />
      {large && (
          <h1 className="text-4xl font-headline font-bold text-primary">Budget Guru</h1>
      )}
    </div>
  );
}
