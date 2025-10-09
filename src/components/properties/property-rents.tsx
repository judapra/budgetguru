
'use client'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { deleteDoc, doc, collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PropertyRentForm } from './property-rent-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type PropertyRent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, Banknote, Landmark, Pencil, Briefcase, CircleDollarSign, MessageSquareText, FileUp, Info } from 'lucide-react';
import { PropertyRentEditForm } from './property-rent-edit-form';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


export function PropertyRents({ propertyId, propertyName, userId, baseRentAmount, adminFee }: { propertyId: string, propertyName: string, userId: string, baseRentAmount: number, adminFee: number }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const rentsQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, `users/${userId}/properties/${propertyId}/rents`), orderBy('date', 'desc'));
    }, [userId, firestore, propertyId]);
    
    const { data: rents } = useCollection<PropertyRent>(rentsQuery);

    const handleDeleteRent = async (rent: PropertyRent) => {
        if (!firestore || !user) return;
        
        try {
            // First, find and delete the corresponding income document
            const incomeCollectionName = rent.destination === 'Personal' ? 'incomes' : 'company_incomes';
            const incomeQuery = query(collection(firestore, `users/${user.uid}/${incomeCollectionName}`), where("propertyRentId", "==", rent.id));
            const incomeSnap = await getDocs(incomeQuery);
            
            if (!incomeSnap.empty) {
                const incomeDocRef = incomeSnap.docs[0].ref;
                await deleteDoc(incomeDocRef);
            }

            // After successfully deleting the income, delete the rent document
            const rentDocRef = doc(firestore, `users/${user.uid}/properties/${propertyId}/rents/${rent.id}`);
            await deleteDoc(rentDocRef);

            toast({ title: "Sucesso!", description: "Registro de aluguel e receita correspondente foram excluídos." });

        } catch (error) {
            console.error("Error deleting rent and associated income:", error);
            toast({ variant: 'destructive', title: 'Erro', description: "Não foi possível excluir o aluguel e a receita associada." });
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/properties/${propertyId}/rents/${rent.id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    const formatCurrency = (value?: number) => {
        if (value === null || value === undefined) return 'R$ 0,00';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Aluguéis Recebidos</h4>
                <PropertyRentForm propertyId={propertyId} propertyName={propertyName} baseRentAmount={baseRentAmount} adminFee={adminFee} />
            </div>
             {rents && rents.length > 0 ? (
                <ul className="space-y-2">
                {rents.map((rent) => {
                    const receivedAmount = rent.isAdjustment 
                        ? rent.amount - (rent.amount * adminFee / 100) + (rent.additions || 0) - (rent.discounts || 0)
                        : rent.amount + (rent.additions || 0) - (rent.discounts || 0);

                    const DestinationIcon = rent.destination === 'Personal' ? CircleDollarSign : Briefcase;
                    return (
                        <li key={rent.id} className="flex justify-between items-start bg-muted/50 p-3 rounded-md">
                            <div className="flex-1 space-y-2">
                                <div className='flex justify-between items-start'>
                                    <div>
                                     <p className="text-sm font-semibold">{format(new Date(rent.date), "MMMM 'de' yyyy", { locale: ptBR })}</p>
                                     <p className="text-xs text-muted-foreground capitalize">{new Date(rent.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' })}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {rent.isAdjustment && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge variant="outline" className="border-blue-500 text-blue-500">Reajuste</Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>O valor base do imóvel foi atualizado a partir deste lançamento.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        <p className="text-sm font-bold text-green-600">{formatCurrency(receivedAmount)}</p>
                                    </div>
                                </div>
                                
                                <div className='text-xs text-muted-foreground space-y-1.5 border-t border-border/50 pt-2'>
                                    <div className="flex items-center gap-2">
                                        <DestinationIcon className="h-3 w-3" />
                                        <span>Destino: {rent.destination === 'Personal' ? 'Pessoal' : 'Empresa'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Landmark className="h-3 w-3" />
                                        <span>Depósito: {rent.account}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Banknote className="h-3 w-3" />
                                        <span>
                                            {rent.isAdjustment ? "Bruto" : "Base"}: {formatCurrency(rent.amount)}
                                            {rent.additions ? <span className="text-blue-500"> + {formatCurrency(rent.additions)}</span> : ''}
                                            {rent.discounts ? <span className="text-orange-500"> - {formatCurrency(rent.discounts)}</span> : ''}
                                        </span>
                                    </div>
                                    {rent.details && (
                                        <div className="flex items-start gap-2">
                                            <MessageSquareText className="h-3 w-3 mt-0.5" />
                                            <span className='italic'>{rent.details}</span>
                                        </div>
                                    )}
                                </div>
                                
                            </div>
                            <div className="flex flex-col items-center justify-start ml-2">
                                <PropertyRentEditForm userId={userId} propertyId={propertyId} propertyName={propertyName} rent={rent} baseRentAmount={baseRentAmount} adminFee={adminFee} />
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteRent(rent)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </li>
                    )
                })}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluguel cadastrado.</p>
            )}
        </div>
    )
}
