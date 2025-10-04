'use client';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { Dashboard } from '@/components/dashboard/dashboard';
import { Loader2 } from 'lucide-react';
import { updateUserProfile } from '@/firebase/user-actions';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // User is logged in, ensure their profile exists in Firestore
        updateUserProfile(firestore, user);
      } else {
        // User is not logged in, redirect to login
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router, firestore]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <Dashboard />
      </main>
    </div>
  );
}
