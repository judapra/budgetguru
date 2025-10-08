'use client';

import { useUser } from "@/firebase";
import { Button } from "./ui/button";
// --- CORREÇÃO APLICADA AQUI ---
// Troquei o import relativo por um alias, que é mais seguro e padronizado.
import { Logo } from "@/components/logo"; 
import Link from "next/link";
import { MainNav } from "./main-nav";
import { UserNav } from "./user-nav";

export function AppHeader() {
  const { user } = useUser();
  
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Logo className="h-12 w-12" />
          </Link>
          {user && <MainNav />}
        </div>
        {user && (
          <UserNav />
        )}
      </div>
    </header>
  );
}