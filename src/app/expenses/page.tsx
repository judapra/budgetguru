'use client';
import { AppHeader } from "@/components/app-header";

export default function ExpensesPage() {

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold font-headline mb-4">Despesas</h1>
        <p>Aqui você poderá cadastrar e visualizar suas despesas.</p>
      </main>
    </div>
  );
}