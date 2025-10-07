'use server';
import { Firestore, collection, addDoc, getDocs, query, where, DocumentReference, doc } from 'firebase/firestore';
import type { Category } from './types';

/**
 * Finds a category by name for a user or creates it if it doesn't exist.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param categoryName The name of the category to find or create.
 * @param categoryType The type of the category ('Income' or 'Expense').
 * @param collectionName The name of the collection to search in ('categories' or 'company_categories').
 * @returns The existing or newly created category document reference.
 */
export async function getOrCreateCategory(
    firestore: Firestore,
    userId: string,
    categoryName: string,
    categoryType: 'Income' | 'Expense',
    collectionName: 'categories' | 'company_categories'
): Promise<DocumentReference> {
    const categoryCollectionRef = collection(firestore, `users/${userId}/${collectionName}`);
    
    // 1. Check if the category already exists
    const q = query(
        categoryCollectionRef,
        where('name', '==', categoryName),
        where('type', '==', categoryType)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // 2. If it exists, return its reference
        return querySnapshot.docs[0].ref;
    } else {
        // 3. If it doesn't exist, create it
        const newCategory: Omit<Category, 'id'> = {
            name: categoryName,
            type: categoryType,
            userId: userId,
        };
        const docRef = await addDoc(categoryCollectionRef, newCategory);
        return docRef;
    }
}
