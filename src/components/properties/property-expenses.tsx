'use client'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { deleteDoc, doc, collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PropertyExpenseForm } from './property-expense-form';
import { format } from 'date-fns';
import { type PropertyExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, Briefcase, CircleDollarSign } from 'lucide-react';


export function PropertyExpenses({ propertyId, propertyName, userId }: { propertyId: string, propertyName: string, userId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const expensesQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, `users/${userId}/properties/${propertyId}/expenses`), orderBy('date', 'desc'));
    }, [userId, firestore, propertyId]);
    
    const { data: expenses } = useCollection<PropertyExpense>(expensesQuery);

    const handleDeleteExpense = async (expense: PropertyExpense) => {
        if (!firestore || !user) return;

        try {
            const expenseCollectionName = expense.destination === 'Personal' ? 'expenses' : 'company_expenses';
            const generalExpenseQuery = query(collection(firestore, `users/${user.uid}/${expenseCollectionName}`), where("propertyExpenseId", "==", expense.id));
            const generalExpenseSnap = await getDocs(generalExpenseQuery);

            if (!generalExpenseSnap.empty) {
                await deleteDoc(generalExpenseSnap.docs[0].ref);
            }

            const propertyExpenseRef = doc(firestore, `users/${user.uid}/properties/${propertyId}/expenses/${expense.id}`);
            await deleteDoc(propertyExpenseRef);

            toast({ title: "Sucesso!", description: "Despesa do imóvel e lançamento correspondente excluídos." });

        } catch (error) {
            console.error("Error deleting property expense and associated expense:", error);
            toast({ variant: 'destructive', title: 'Erro', description: "Não foi possível excluir a despesa e o lançamento associado." });
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/properties/${propertyId}/expenses/${expense.id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Despesas do Imóvel</h4>
                <PropertyExpenseForm userId={userId} propertyId={propertyId} propertyName={propertyName} />
            </div>
             {expenses && expenses.length > 0 ? (
                <ul className="space-y-2">
                {expenses.map((expense) => {
                    const DestinationIcon = expense.destination === 'Personal' ? CircleDollarSign : Briefcase;
                    return (
                        <li key={expense.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                            <div className='flex-1'>
                                <p className="text-sm font-medium">{expense.description}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(expense.date), 'dd/MM/yyyy')}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <DestinationIcon className="h-3 w-3" />
                                    <span>Lançado em: {expense.destination === 'Personal' ? 'Pessoal' : 'Empresa'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-red-500">-{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                <PropertyExpenseForm userId={userId} propertyId={propertyId} propertyName={propertyName} expense={expense} />
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteExpense(expense)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </li>
                    )
                })}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa cadastrada.</p>
            )}
        </div>
    )
}
