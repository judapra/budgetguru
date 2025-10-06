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
import { Trash2 } from 'lucide-react';


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
