'use server';

import { generateRealEstateReport } from '@/ai/flows/real-estate-report-generator';
import { initializeFirebase } from '@/firebase/server';
import type { Property, PropertyExpense, PropertyRent } from '@/lib/types';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

interface ReportState {
    summary: string | null;
    error: string | null;
}

async function getRealEstateData(userId: string): Promise<string> {
    const { firestore } = initializeFirebase();
    
    const propertiesRef = firestore.collection(`users/${userId}/properties`);
    const propertiesSnap = await propertiesRef.get();
    
    if (propertiesSnap.empty) {
        return "O usuário não possui imóveis cadastrados.";
    }

    let allDataString = "";

    for (const propDoc of propertiesSnap.docs) {
        const property = propDoc.data() as Property;
        allDataString += `Imóvel: ${property.name} (Endereço: ${property.address})\n`;
        allDataString += `- Aluguel Bruto: ${property.grossRent}, Taxa Adm: ${property.adminFee}%, Aluguel Líquido: ${property.netRent}\n`;
        
        const rentsRef = propDoc.ref.collection('rents');
        const rentsSnap = await rentsRef.get();
        if (!rentsSnap.empty) {
            allDataString += "- Aluguéis Recebidos:\n";
            rentsSnap.forEach(rentDoc => {
                const rent = rentDoc.data() as PropertyRent;
                allDataString += `  - Data: ${new Date(rent.date).toLocaleDateString()}, Valor: ${rent.amount}\n`;
            });
        }

        const expensesRef = propDoc.ref.collection('expenses');
        const expensesSnap = await expensesRef.get();
         if (!expensesSnap.empty) {
            allDataString += "- Despesas:\n";
            expensesSnap.forEach(expenseDoc => {
                const expense = expenseDoc.data() as PropertyExpense;
                allDataString += `  - Data: ${new Date(expense.date).toLocaleDateString()}, Descrição: ${expense.description}, Valor: ${expense.amount}\n`;
            });
        }
        allDataString += "\n";
    }

    return allDataString;
}


export async function handleGenerateReport(prevState: ReportState, formData: FormData): Promise<ReportState> {
    try {
        const { auth } = initializeFirebase();
        // This is a placeholder for getting the current user's ID.
        // In a real app, you'd get this from the session.
        const users = await auth.listUsers();
        if(users.users.length === 0) {
            return { summary: null, error: 'Nenhum usuário encontrado para gerar o relatório.' };
        }
        const userId = users.users[0].uid;


        const financialData = await getRealEstateData(userId);
        
        if (financialData.includes("não possui imóveis")) {
            return { summary: null, error: "Você não possui imóveis cadastrados para gerar um relatório." };
        }

        const report = await generateRealEstateReport({ financialData });
        return { summary: report.summary, error: null };
    } catch (e: any) {
        console.error("Error generating report:", e);
        let errorMessage = 'A IA falhou em gerar o relatório. Tente novamente mais tarde.';
        if (e.message.includes('permission-denied') || e.message.includes('PERMISSION_DENIED')) {
            errorMessage = 'Erro de permissão ao buscar dados do Firestore. Verifique as regras de segurança.';
        }
        return { summary: null, error: errorMessage };
    }
}
