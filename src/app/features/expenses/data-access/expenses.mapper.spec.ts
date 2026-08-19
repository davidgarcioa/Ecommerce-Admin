import { toExpenseListItem } from './expenses.mapper';
import { expenseFixture } from './expenses.fixtures';

describe('expenses mapper', () => {
  it('maps backend resource metadata to a presentation row', () => {
    const item = toExpenseListItem(expenseFixture);

    expect(item.concept).toBe('Flete urbano');
    expect(item.amount).toBe(120000);
    expect(item.statusLabel).toBe('Pagado');
    expect(item.categoryLabel).toBe('Logística');
    expect(item.paymentMethodLabel).toBe('Transferencia');
    expect(item.hasReceipt).toBe(true);
  });

  it('uses safe defaults for generic resources without metadata', () => {
    const item = toExpenseListItem({ ...expenseFixture, metadata: undefined });

    expect(item.amount).toBe(0);
    expect(item.status).toBe('pending');
    expect(item.category).toBe('other');
  });
});
