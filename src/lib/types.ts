

export type Category = {
    id: string;
    name: string;
    type: 'Income' | 'Expense';
    userId: string;
  };
  
  export type Income = {
      id: string;
      userId: string;
      categoryId: string;
      receiptMethod: string;
      date: string;
      amount: number;
      details: string;
      // Added to link income to a property rent
      propertyRentId?: string;
  };

  export type Expense = {
    id: string;
    userId: string;
    categoryId: string;
    paymentMethod: string;
    date: string;
    amount: number;
    details: string;
    propertyExpenseId?: string;
    installments?: string;
};

export type Transaction = {
    id: string;
    name: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
  };
  
  export type Budget = {
    id: string;
    name: string;
    allocated: number;
    spent: number;
  };

  export type Property = {
    id:string;
    userId: string;
    name: string;
    address: string;
    grossRent: number;
    netRent: number;
    adminFee: number;
    status: 'Alugado' | 'Vazio'; // This will be derived, but kept for potential direct usage
    tenantName?: string;
    tenantPhone?: string;
  };
  
  export type PropertyExpense = {
    id: string;
    propertyId: string;
    userId: string;
    date: string;
    description: string;
    amount: number;
    destination: 'Personal' | 'Company';
  };
  
  export type PropertyRent = {
    id: string;
    propertyId: string;
    date: string;
    amount: number;
    details?: string;
    account: string;
    discounts?: number;
    additions?: number;
    destination: 'Personal' | 'Company';
    userId: string;
    isAdjustment?: boolean;
  };

  export type Company = {
    id: string;
    userId: string;
    name: string;
  }


