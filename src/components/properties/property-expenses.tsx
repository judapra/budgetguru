'use client'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { deleteDoc, doc, collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PropertyExpenseForm } from './property-expense-form';
import { format, isBefore, startOfDay, endOfDay, differenceInCalendarMonths, addMonths } from 'date-fns';
import { type PropertyExpense, type PropertyRecurringExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, Briefcase, CircleDollarSign, Repeat, History, Pencil } from 'lucide-react';
import React from 'react';
import { PropertyRecurringExpenseForm } from './property-recurring-expense-form';
import { Badge } from '../ui/badge';


export function PropertyExpenses({ propertyId, propertyName, userId }: { propertyId: string, propertyName: string, userId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Fetches single, one-time expenses
    const singleExpensesQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, `users/${userId}/properties/${propertyId}/expenses`), orderBy('date', 'desc'));
    }, [userId, firestore, propertyId]);
    
    // Fetches the templates for recurring expenses
    const recurringExpensesQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, `users/${userId}/properties/${propertyId}/recurring_expenses`));
    }, [userId, firestore, propertyId]);

    const { data: singleExpenses } = useCollection<PropertyExpense>(singleExpensesQuery);
    const { data: recurringExpenseTemplates } = useCollection<PropertyRecurringExpense>(recurringExpensesQuery);

    const projectedExpenses = useMemo(() => {
        const allExpenses: (PropertyExpense & {isProjected?: boolean, recurringTemplateId?: string})[] = [...(singleExpenses || [])];
        
        recurringExpenseTemplates?.forEach(template => {
            const startDate = new Date(template.startDate);
            const endDate = new Date(template.endDate);
            let currentDate = startDate;

            while (isBefore(currentDate, endDate) || currentDate.getMonth() === endDate.getMonth()) {
                const alreadyExists = singleExpenses?.some(e => 
                    new Date(e.date).getMonth() === currentDate.getMonth() &&
                    new Date(e.date).getFullYear() === currentDate.getFullYear() &&
                    e.description === template.description
                );

                if (!alreadyExists) {
                    allExpenses.push({
                        ...template,
                        id: `${template.id}-${currentDate.toISOString()}`,
                        date: currentDate.toISOString(),
                        isProjected: true,
                        recurringTemplateId: template.id
                    });
                }
                currentDate = addMonths(currentDate, 1);
            }
        });
        
        return allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [singleExpenses, recurringExpenseTemplates]);


    const handleDeleteExpense = async (expense: PropertyExpense) => {
        if (!firestore || !user) return;

        try {
            // This is a projected expense, so there's nothing to delete from DB
            if ('isProjected' in expense && expense.isProjected) {
                toast({ variant: 'destructive', title: 'Atenção', description: "Esta é uma despesa projetada e não pode ser excluída. Para removê-la, edite ou exclua a despesa recorrente original." });
                return;
            }

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
    
    const handleDeleteRecurringExpense = async (recurringExpenseId: string) => {
        if (!firestore || !user) return;
        
        try {
            const recurringExpenseRef = doc(firestore, `users/${user.uid}/properties/${propertyId}/recurring_expenses/${recurringExpenseId}`);
            await deleteDoc(recurringExpenseRef);
            toast({ title: "Sucesso!", description: "Despesa recorrente e suas projeções foram removidas." });
        } catch (error) {
            console.error("Error deleting recurring expense:", error);
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/properties/${propertyId}/recurring_expenses/${recurringExpenseId}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Despesas do Imóvel</h4>
                <div className='flex gap-2'>
                    <PropertyExpenseForm userId={userId} propertyId={propertyId} propertyName={propertyName} />
                    <PropertyRecurringExpenseForm userId={userId} propertyId={propertyId} />
                </div>
            </div>
             {(projectedExpenses && projectedExpenses.length > 0) || (recurringExpenseTemplates && recurringExpenseTemplates.length > 0) ? (
                <ul className="space-y-2">
                {projectedExpenses.map((expense) => {
                    const DestinationIcon = expense.destination === 'Personal' ? CircleDollarSign : Briefcase;
                    const isProjected = 'isProjected' in expense && expense.isProjected;
                    const isDueForRenewal = expense.recurringTemplateId && isBefore(new Date(expense.date), new Date());
                    
                    const template = recurringExpenseTemplates?.find(t => t.id === expense.recurringTemplateId);

                    return (
                        <li key={expense.id} className={`flex justify-between items-center p-3 rounded-md ${isProjected ? 'bg-muted/30 border border-dashed' : 'bg-muted/50'}`}>
                            <div className='flex-1'>
                                <p className="text-sm font-medium flex items-center gap-2">
                                    {expense.description}
                                    {expense.recurringTemplateId && <Repeat className='h-3 w-3 text-blue-500' />}
                                    {isProjected && <Badge variant='outline' className='text-xs'>A Lançar</Badge>}
                                </p>
                                <p className="text-xs text-muted-foreground">{format(new Date(expense.date), 'dd/MM/yyyy')}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <DestinationIcon className="h-3 w-3" />
                                    <span>Lançado em: {expense.destination === 'Personal' ? 'Pessoal' : 'Empresa'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-red-500">-{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                {isProjected ? (
                                   template && (
                                     <>
                                        <PropertyRecurringExpenseForm userId={userId} propertyId={propertyId} expense={template} />
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteRecurringExpense(template.id)}>
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                     </>
                                   )
                                ) : (
                                    <>
                                        <PropertyExpenseForm userId={userId} propertyId={propertyId} propertyName={propertyName} expense={expense} />
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteExpense(expense)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
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
