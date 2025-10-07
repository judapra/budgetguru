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
  };

  export type Expense = {
    id: string;
    userId: string;
    categoryId: string;
    paymentMethod: string;
    date: string;
    amount: number;
    details: string;
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
    id: string;
    userId: string;
    name: string;
    address: string;
    grossRent: number;
    netRent: number;
    adminFee: number;
    status: 'Alugado' | 'Vazio';
  };
  
  export type PropertyExpense = {
    id: string;
    propertyId: string;
    date: string;
    description: string;
    amount: number;
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
  };

  export type Company = {
    id: string;
    userId: string;
    name: string;
  }
