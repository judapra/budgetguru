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
const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR').format(date);

export const personalTransactions: Transaction[] = [
  { id: '1', name: 'Salário Mensal', category: 'Receita', amount: 5000, type: 'income', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)) },
  { id: '2', name: 'Aluguel', category: 'Moradia', amount: 1500, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)) },
  { id: '3', name: 'Supermercado', category: 'Alimentação', amount: 350, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 3)) },
  { id: '4', name: 'Contas', category: 'Contas', amount: 150, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 5)) },
  { id: '5', name: 'Projeto Freelance', category: 'Receita', amount: 750, type: 'income', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 10)) },
];

export const personalBudgets: Budget[] = [
  { id: '1', name: 'Supermercado', allocated: 400, spent: 350 },
  { id: '2', name: 'Entretenimento', allocated: 200, spent: 75 },
  { id: '3', name: 'Transporte', allocated: 150, spent: 120 },
  { id: '4', name: 'Compras', allocated: 300, spent: 280 },
];

export const businessTransactions: Transaction[] = [
    { id: '1', name: 'Pagamento Cliente - Projeto X', category: 'Vendas', amount: 10000, type: 'income', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 2)) },
    { id: '2', name: 'Material de Escritório', category: 'Despesas', amount: 450, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 4)) },
    { id: '3', name: 'Assinatura de Software', category: 'Custos Fixos', amount: 120, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 6)) },
    { id: '4', name: 'Pagamento Cliente - Projeto Y', category: 'Vendas', amount: 8500, type: 'income', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 12)) },
    { id: '5', name: 'Campanha de Marketing', category: 'Despesas', amount: 1200, type: 'expense', date: formatDate(new Date(today.getFullYear(), today.getMonth(), 15)) },
];

export const businessBudgets: Budget[] = [
    { id: '1', name: 'Marketing', allocated: 2000, spent: 1200 },
    { id: '2', name: 'Software e Ferramentas', allocated: 500, spent: 120 },
    { id: '3', name: 'Viagens', allocated: 1000, spent: 0 },
    { id: '4', name: 'Material de Escritório', allocated: 600, spent: 450 },
];

export const chartData = [
    { month: "Janeiro", income: 5000, expenses: 3200 },
    { month: "Fevereiro", income: 5200, expenses: 3400 },
    { month: "Março", income: 5100, expenses: 3100 },
    { month: "Abril", income: 5500, expenses: 3800 },
    { month: "Maio", income: 5800, expenses: 3600 },
    { month: "Junho", income: 6000, expenses: 4000 },
];

export const businessChartData = [
  { month: "Janeiro", income: 15000, expenses: 8200 },
  { month: "Fevereiro", income: 18200, expenses: 10400 },
  { month: "Março", income: 16100, expenses: 9100 },
  { month: "Abril", income: 20500, expenses: 12800 },
  { month: "Maio", income: 22800, expenses: 13600 },
  { month: "Junho", income: 25000, expenses: 14000 },
];
