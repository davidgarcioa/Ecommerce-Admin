import {
  isFinitePositiveAmount,
  isValidExpenseDateRange,
  normalizeExpenseText,
} from './expenses.validators';

describe('expense validators', () => {
  it('normalizes text and validates positive finite amounts', () => {
    expect(normalizeExpenseText('  pago   oficina  ')).toBe('pago oficina');
    expect(isFinitePositiveAmount(1)).toBe(true);
    expect(isFinitePositiveAmount(0)).toBe(false);
    expect(isFinitePositiveAmount(Infinity)).toBe(false);
  });

  it('validates date ranges', () => {
    expect(isValidExpenseDateRange('2026-07-01', '2026-07-30')).toBe(true);
    expect(isValidExpenseDateRange('2026-07-30', '2026-07-01')).toBe(false);
  });
});
