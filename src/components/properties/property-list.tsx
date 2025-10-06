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
import type { Property, PropertyExpense, PropertyRent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, Home, MapPin } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { deleteDoc, doc, collection, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PropertyForm } from './property-form';
import { PropertyExpenseForm } from './property-expense-form';
import { PropertyRentForm } from './property-rent-form';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


type PropertyListProps = {
  properties: Property[];
  userId: string;
};

function PropertyExpenses({ propertyId, userId }: { propertyId: string, userId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const expensesQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, `users/${userId}/properties/${propertyId}/expenses`), orderBy('date', 'desc'));
    }, [userId, firestore, propertyId]);
    
    const { data: expenses } = useCollection<PropertyExpense>(expensesQuery);

    const handleDeleteExpense = (expenseId: string) => {
        if (!firestore) return;
        const expenseDoc = doc(firestore, `users/${userId}/properties/${propertyId}/expenses/${expenseId}`);

        deleteDoc(expenseDoc)
          .then(() => {
            toast({ title: "Sucesso!", description: "Despesa do imóvel excluída." });
          })
          .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: expenseDoc.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
          });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Despesas do Imóvel</h4>
                <PropertyExpenseForm userId={userId} propertyId={propertyId} />
            </div>
             {expenses && expenses.length > 0 ? (
                <ul className="space-y-2">
                {expenses.map((expense) => (
                    <li key={expense.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                        <div>
                            <p className="text-sm font-medium">{expense.description}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(expense.date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-red-500">-{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteExpense(expense.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa cadastrada.</p>
            )}
        </div>
    )
}

function PropertyRents({ propertyId, userId }: { propertyId: string, userId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const rentsQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, `users/${userId}/properties/${propertyId}/rents`), orderBy('date', 'desc'));
    }, [userId, firestore, propertyId]);
    
    const { data: rents } = useCollection<PropertyRent>(rentsQuery);

    const handleDeleteRent = (rentId: string) => {
        if (!firestore) return;
        const rentDoc = doc(firestore, `users/${userId}/properties/${propertyId}/rents/${rentId}`);

        deleteDoc(rentDoc)
          .then(() => {
            toast({ title: "Sucesso!", description: "Registro de aluguel excluído." });
          })
          .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: rentDoc.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
          });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Aluguéis Recebidos</h4>
                <PropertyRentForm userId={userId} propertyId={propertyId} />
            </div>
             {rents && rents.length > 0 ? (
                <ul className="space-y-2">
                {rents.map((rent) => (
                    <li key={rent.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                        <div>
                            <p className="text-sm font-medium">{rent.details || 'Aluguel'}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(rent.date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-green-500">{rent.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteRent(rent.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluguel cadastrado.</p>
            )}
        </div>
    )
}


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
                        <PropertyRents propertyId={property.id} userId={userId} />
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
