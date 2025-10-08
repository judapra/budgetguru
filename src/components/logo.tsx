import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className, size = 40 }: { className?: string, size?: number }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image 
        src="/logo.svg" 
        alt="Budget Guru Logo" 
        width={size} 
        height={size}
        priority
      />
    </div>
  );
}
