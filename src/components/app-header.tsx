'use client';

import { useUser } from "@/firebase";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainNav } from "./main-nav";

export function AppHeader() {
  const { user, auth } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Logo />
          {user && <MainNav />}
        </div>
        {user && (
          <Button variant="outline" onClick={handleSignOut}>
            Sair
          </Button>
        )}
      </div>
    </header>
  );
}