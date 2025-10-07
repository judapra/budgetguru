'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, Home, MapPin } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PropertyForm } from './property-form';
import { PropertyExpenses } from './property-expenses';
import { PropertyRents } from './property-rents';
import { cn } from '@/lib/utils';


type PropertyListProps = {
  properties: Property[];
  userId: string;
};

export function PropertyList({ properties, userId }: PropertyListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (propertyId: string) => {
    if (!firestore) return;
    const propertyDoc = doc(firestore, `users/${userId}/properties/${propertyId}`);

    deleteDoc(propertyDoc)
      .then(() => {
        toast({
          title: "Sucesso!",
          description: "Imóvel excluído.",
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: propertyDoc.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (properties.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <Home className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Nenhum imóvel cadastrado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
            Você ainda não cadastrou nenhum imóvel. Comece adicionando um para gerenciá-lo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <Card key={property.id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 pt-1">
                        <MapPin className="h-3 w-3"/> {property.address}
                    </CardDescription>
                </div>
                <Badge 
                  className={cn(
                    property.status === 'Alugado' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                  )}
                  variant={'outline'}
                >
                    {property.status}
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Aluguel Bruto</p>
                    <p className="font-medium">{property.grossRent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Taxa Admin ({property.adminFee}%)</p>
                    <p className="font-medium text-red-500">- {(property.grossRent * property.adminFee / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="space-y-1 col-span-2">
                    <p className="text-muted-foreground">Aluguel Líquido Base</p>
                    <p className="font-semibold text-lg text-green-600">{property.netRent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="rents">
                    <AccordionTrigger>Ver Aluguéis</AccordionTrigger>
                    <AccordionContent>
                        <PropertyRents propertyId={property.id} userId={userId} baseRentAmount={property.netRent} />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="expenses">
                    <AccordionTrigger>Ver Despesas</AccordionTrigger>
                    <AccordionContent>
                        <PropertyExpenses propertyId={property.id} userId={userId} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end gap-2">
            <PropertyForm userId={userId} property={property} />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(property.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
