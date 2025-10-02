'use client';

import { useUser } from "@/firebase";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import { useRouter } from "next/navigation";

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
        <Logo />
        {user && (
          <Button variant="outline" onClick={handleSignOut}>
            Sair
          </Button>
        )}
      </div>
    </header>
  );
}
