import { Expense } from './expenses.models';

export const expenseFixture: Expense = {
  id: 'expense-1',
  name: 'Flete urbano',
  description: 'Pago de transporte local',
  metadata: {
    amount: 120000,
    currency: 'COP',
    status: 'paid',
    category: 'logistics',
    paymentMethod: 'bank-transfer',
    responsible: 'Laura',
    supplier: 'Coordinadora',
    expenseDate: '2026-07-29',
    paymentDate: '2026-07-29',
    reference: 'TR-001',
    receiptUrl: 'https://example.com/receipt.pdf',
  },
  createdAt: '2026-07-29T10:00:00.000Z',
  updatedAt: '2026-07-29T11:00:00.000Z',
};
