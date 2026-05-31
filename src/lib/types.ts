

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
  installment?: string; // e.g., "1/12", "2/3"
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
  userId: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  type: 'Personal' | 'Company';
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
  tenantName?: string;
  tenantPhone?: string;
  iptuContributorNumber?: string;
  iptuUrl?: string;
  type?: 'Tradicional' | 'Airbnb';
  adminCompany?: string;
  adminContactUrl?: string;
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

export type PropertyRecurringExpense = {
  id: string;
  propertyId: string;
  userId: string;
  startDate: string;
  endDate: string;
  description: string;
  amount: number;
  destination: 'Personal' | 'Company';
}

export type PropertyRent = {
  id: string;
  propertyId: string;
  date: string;
  amount: number; // If isAdjustment is true, this is the GROSS rent. Otherwise, it's the NET amount received.
  details?: string;
  account: string;
  discounts?: number;
  additions?: number;
  destination: 'Personal' | 'Company';
  userId: string;
  isAdjustment: boolean;
  airbnbGrossAmount?: number;
  commissionAmount?: number;
  extraExpensesAmount?: number;
};

export type Company = {
  id: string;
  userId: string;
  name: string;
}

export type PropertyReservation = {
  id: string;
  propertyId: string;
  userId: string;
  guestName?: string;
  checkIn: string; // ISO date string
  checkOut: string; // ISO date string
  grossAmount: number;
  netAmount: number;
  status: 'Agendada' | 'Concluída' | 'Cancelada';
};
