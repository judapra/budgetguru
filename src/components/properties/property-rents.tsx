'use client'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { deleteDoc, doc, collection, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PropertyRentForm } from './property-rent-form';
import { format } from 'date-fns';
import { type PropertyRent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, Banknote, Landmark } from 'lucide-react';


export function PropertyRents({ propertyId, userId }: { propertyId: string, userId: string }) {
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

    const formatCurrency = (value?: number) => {
        if (!value) return null;
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Aluguéis Recebidos</h4>
                <PropertyRentForm userId={userId} propertyId={propertyId} />
            </div>
             {rents && rents.length > 0 ? (
                <ul className="space-y-2">
                {rents.map((rent) => {
                    const finalAmount = (rent.amount || 0) + (rent.additions || 0) - (rent.discounts || 0);
                    return (
                        <li key={rent.id} className="flex justify-between items-start bg-muted/50 p-3 rounded-md">
                            <div className="flex-1 space-y-2">
                                <div className='flex justify-between items-center'>
                                    <p className="text-sm font-medium">{rent.details || 'Aluguel'}</p>
                                    <p className="text-sm font-bold text-green-600">{formatCurrency(finalAmount)}</p>
                                </div>
                                
                                <div className='text-xs text-muted-foreground space-y-1'>
                                    <div className="flex items-center gap-2">
                                        <Landmark className="h-3 w-3" />
                                        <span>Depósito em: {rent.account}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Banknote className="h-3 w-3" />
                                        <span>
                                            Base: {formatCurrency(rent.amount)}
                                            {rent.additions ? <span className="text-blue-500"> + {formatCurrency(rent.additions)}</span> : ''}
                                            {rent.discounts ? <span className="text-orange-500"> - {formatCurrency(rent.discounts)}</span> : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pt-1">Recebido em: {format(new Date(rent.date), 'dd/MM/yyyy')}</p>
                                </div>

                                {rent.details && <p className="text-xs text-muted-foreground italic pt-1">{rent.details}</p>}
                                
                            </div>
                            <div className="flex flex-col items-end justify-start ml-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteRent(rent.id)}>
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
