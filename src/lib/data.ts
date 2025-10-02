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

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const personalTransactions: Transaction[] = [
  { id: '1', name: 'Monthly Salary', category: 'Income', amount: 5000, type: 'income', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)) },
  { id: '2', name: 'Rent', category: 'Housing', amount: 1500, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)) },
  { id: '3', name: 'Groceries', category: 'Food', amount: 350, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 3)) },
  { id: '4', name: 'Utilities', category: 'Bills', amount: 150, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 5)) },
  { id: '5', name: 'Freelance Project', category: 'Income', amount: 750, type: 'income', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 10)) },
];

export const personalBudgets: Budget[] = [
  { id: '1', name: 'Groceries', allocated: 400, spent: 350 },
  { id: '2', name: 'Entertainment', allocated: 200, spent: 75 },
  { id: '3', name: 'Transport', allocated: 150, spent: 120 },
  { id: '4', name: 'Shopping', allocated: 300, spent: 280 },
];

export const businessTransactions: Transaction[] = [
    { id: '1', name: 'Client Payment - Project X', category: 'Sales', amount: 10000, type: 'income', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 2)) },
    { id: '2', name: 'Office Supplies', category: 'Expenses', amount: 450, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 4)) },
    { id: '3', name: 'Software Subscription', category: 'Overhead', amount: 120, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 6)) },
    { id: '4', name: 'Client Payment - Project Y', category: 'Sales', amount: 8500, type: 'income', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 12)) },
    { id: '5', name: 'Marketing Campaign', category: 'Expenses', amount: 1200, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 15)) },
];

export const businessBudgets: Budget[] = [
    { id: '1', name: 'Marketing', allocated: 2000, spent: 1200 },
    { id: '2', name: 'Software & Tools', allocated: 500, spent: 120 },
    { id: '3', name: 'Travel', allocated: 1000, spent: 0 },
    { id: '4', name: 'Office Supplies', allocated: 600, spent: 450 },
];

export const chartData = [
    { month: "January", income: 5000, expenses: 3200 },
    { month: "February", income: 5200, expenses: 3400 },
    { month: "March", income: 5100, expenses: 3100 },
    { month: "April", income: 5500, expenses: 3800 },
    { month: "May", income: 5800, expenses: 3600 },
    { month: "June", income: 6000, expenses: 4000 },
];

export const businessChartData = [
  { month: "January", income: 15000, expenses: 8200 },
  { month: "February", income: 18200, expenses: 10400 },
  { month: "March", income: 16100, expenses: 9100 },
  { month: "April", income: 20500, expenses: 12800 },
  { month: "May", income: 22800, expenses: 13600 },
  { month: "June", income: 25000, expenses: 14000 },
];
