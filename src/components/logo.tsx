
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className, large = false }: { className?: string, large?: boolean }) {
  const size = large ? 80 : 40;
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image 
        src="/logo.svg" 
        alt="Budget Guru Logo" 
        width={size} 
        height={size}
      />
    </div>
  );
}
