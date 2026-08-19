import { normalizeBoolean, normalizeCurrency, normalizeDate } from './validation.utils';

describe('file validation utils', () => {
  it('should normalize colombian currency values', () => {
    expect(normalizeCurrency('$ 1.250.000')).toBe(1250000);
    expect(normalizeCurrency('1.250.000,50')).toBe(1250000.5);
  });

  it('should normalize dates and booleans', () => {
    expect(normalizeDate('2026-07-29')).toBe('2026-07-29');
    expect(normalizeBoolean('sí')).toBe(true);
    expect(normalizeBoolean('0')).toBe(false);
  });
});
