'use client';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { deleteDoc, doc, collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PropertyReservationForm } from './property-reservation-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type PropertyReservation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, User, CalendarDays, Banknote, CalendarCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

export function PropertyReservations({ propertyId, propertyName, userId, adminFee }: { propertyId: string, propertyName: string, userId: string, adminFee: number }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const reservationsQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, `users/${userId}/properties/${propertyId}/reservations`), orderBy('checkIn', 'desc'));
    }, [userId, firestore, propertyId]);
    
    const { data: reservations } = useCollection<PropertyReservation>(reservationsQuery);

    const handleDeleteReservation = async (reservation: PropertyReservation) => {
        if (!firestore || !user) return;
        
        try {
            const resDocRef = doc(firestore, `users/${user.uid}/properties/${propertyId}/reservations/${reservation.id}`);
            await deleteDoc(resDocRef);

            toast({ title: "Sucesso!", description: "Reserva excluída." });

        } catch (error) {
            console.error("Error deleting reservation:", error);
            toast({ variant: 'destructive', title: 'Erro', description: "Não foi possível excluir a reserva." });
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/properties/${propertyId}/reservations/${reservation.id}`,
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
                <h4 className="font-semibold">Reservas</h4>
                <PropertyReservationForm propertyId={propertyId} propertyName={propertyName} adminFee={adminFee} />
            </div>
             {reservations && reservations.length > 0 ? (
                <ul className="space-y-2">
                {reservations.map((reservation) => {
                    const statusColor = reservation.status === 'Concluída' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : reservation.status === 'Agendada' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-red-100 text-red-800 border-red-200';

                    return (
                        <li key={reservation.id} className="flex justify-between items-start bg-muted/50 p-3 rounded-md">
                            <div className="flex-1 space-y-2">
                                <div className='flex justify-between items-start'>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm font-semibold">
                                                {format(new Date(reservation.checkIn), "dd/MMM", { locale: ptBR })} até {format(new Date(reservation.checkOut), "dd/MMM", { locale: ptBR })}
                                            </p>
                                        </div>
                                        {reservation.guestName && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="h-3 w-3" />
                                                <span>{reservation.guestName}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                         <Badge variant="outline" className={cn("text-xs font-normal", statusColor)}>
                                            {reservation.status}
                                        </Badge>
                                        <p className="text-sm font-bold text-green-600" title="Valor Líquido">{formatCurrency(reservation.netAmount)}</p>
                                    </div>
                                </div>
                                
                                <div className='text-xs text-muted-foreground space-y-1.5 border-t border-border/50 pt-2'>
                                    <div className="flex items-center gap-2">
                                        <Banknote className="h-3 w-3" />
                                        <span>
                                            Bruto: {formatCurrency(reservation.grossAmount)} | Taxa ({adminFee}%): {formatCurrency(reservation.grossAmount * adminFee / 100)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-start ml-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteReservation(reservation)}>
                                    <Trash2 className="h-3 w-3 text-red-500 hover:text-red-600" />
                                </Button>
                            </div>
                        </li>
                    )
                })}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma reserva cadastrada.</p>
            )}
        </div>
    )
}
