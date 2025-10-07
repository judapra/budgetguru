import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo.svg" alt="Budget Guru Logo" width={32} height={32} />
      <h1 className="text-2xl font-bold text-foreground font-headline">Budget Guru</h1>
    </div>
  );
}
