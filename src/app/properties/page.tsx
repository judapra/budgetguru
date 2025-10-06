'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { AppHeader } from "@/components/app-header";
import { Loader2, PlusCircle } from 'lucide-react';
import type { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/properties/property-form';
import { PropertyList } from '@/components/properties/property-list';
import { useMemo } from 'react';

export default function PropertiesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const propertiesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/properties`);
  }, [user, firestore]);

  const { data: properties, isLoading } = useCollection<Property>(propertiesQuery);

  const sortedProperties = useMemo(() => {
    if (!properties) return [];
    return [...properties].sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold font-headline">Meus Imóveis</h1>
            {user && (
              <PropertyForm userId={user.uid} />
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <PropertyList properties={sortedProperties || []} userId={user?.uid || ''} />
          )}
        </div>
      </main>
    </div>
  );
}
