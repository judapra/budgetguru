import { Landmark } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Landmark className="h-8 w-8 text-primary" />
      <h1 className="text-2xl font-bold text-foreground font-headline">Guru do Orçamento</h1>
    </div>
  );
}
