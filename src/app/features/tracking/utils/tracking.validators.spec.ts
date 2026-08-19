import { normalizeTrackingValue, validateTrackingSearch } from './tracking.validators';

describe('tracking validators', () => {
  it('validates supported search types', () => {
    expect(validateTrackingSearch({ type: 'order', value: 'ORD-2026-0001' }).valid).toBe(true);
    expect(validateTrackingSearch({ type: 'tracking', value: 'GUIA-123' }).valid).toBe(true);
    expect(validateTrackingSearch({ type: 'phone', value: '+573001112233' }).valid).toBe(true);
    expect(validateTrackingSearch({ type: 'email', value: 'cliente@example.com' }).valid).toBe(
      true,
    );
    expect(validateTrackingSearch({ type: 'name', value: 'Laura' }).valid).toBe(true);
  });

  it('rejects empty or unsafe searches', () => {
    expect(validateTrackingSearch({ type: 'tracking', value: '' }).valid).toBe(false);
    expect(validateTrackingSearch({ type: 'tracking', value: '***' }).valid).toBe(false);
    expect(validateTrackingSearch({ type: 'name', value: 'Lu' }).valid).toBe(false);
  });

  it('normalizes tracking numbers', () => {
    expect(normalizeTrackingValue('tracking', ' GUIA 123 ')).toBe('GUIA123');
  });
});
