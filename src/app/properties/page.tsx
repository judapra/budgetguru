'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { AppHeader } from "@/components/app-header";
import { Loader2, PlusCircle, Search } from 'lucide-react';
import type { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/properties/property-form';
import { PropertyList } from '@/components/properties/property-list';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';

export default function PropertiesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const propertiesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/properties`);
  }, [user, firestore]);

  const { data: properties, isLoading } = useCollection<Property>(propertiesQuery);

  const filteredAndSortedProperties = useMemo(() => {
    if (!properties) return [];
    const filtered = properties.filter(prop => 
        prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [properties, searchTerm]);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold font-headline">Meus Imóveis</h1>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search"
                        placeholder="Buscar por nome ou endereço..."
                        className="pl-9 w-full sm:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {user && (
                    <PropertyForm userId={user.uid} />
                )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <PropertyList properties={filteredAndSortedProperties || []} userId={user?.uid || ''} />
          )}
        </div>
      </main>
    </div>
  );
}
