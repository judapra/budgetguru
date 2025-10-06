'use client'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { deleteDoc, doc, collection, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PropertyExpenseForm } from './property-expense-form';
import { format } from 'date-fns';
import { type PropertyExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';


export function PropertyExpenses({ propertyId, userId }: { propertyId: string, userId: string }) {
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
