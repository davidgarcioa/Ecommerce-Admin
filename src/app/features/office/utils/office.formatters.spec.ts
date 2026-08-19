import { formatCurrency, formatDate, formatNumber, maskPhone } from './office.formatters';

describe('office formatters', () => {
  it('formats Colombian currency', () => {
    expect(formatCurrency(131900)).toContain('$');
    expect(formatCurrency(131900)).toContain('131');
  });

  it('formats numbers and dates', () => {
    expect(formatNumber(139)).toBe('139');
    expect(formatDate('2026-07-29T10:00:00.000Z')).toContain('29');
  });

  it('masks phone numbers without losing the last digits', () => {
    expect(maskPhone('+573001112233')).toContain('33');
    expect(maskPhone('123')).toBe('123');
  });
});
