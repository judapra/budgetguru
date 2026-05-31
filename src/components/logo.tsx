import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className, size = 40, width }: { className?: string, size?: number, width?: number }) {
  // If user provides a width, use it. Otherwise, default to a standard 3.2:1 aspect ratio for wide rectangular logos.
  const calculatedWidth = width || size * 3.2;

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image 
        src="/logo-budget-guru.png" 
        alt="Budget Guru Logo" 
        width={calculatedWidth} 
        height={size}
        style={{ height: `${size}px`, width: 'auto', maxWidth: '100%' }}
        priority
      />
    </div>
  );
}
