import { isValidCarrier, isValidTrackingNumber } from './logistics.validators';

describe('logistics validators', () => {
  it('validates tracking numbers without accepting punctuation-heavy values', () => {
    expect(isValidTrackingNumber('ABC-1234')).toBe(true);
    expect(isValidTrackingNumber('')).toBe(true);
    expect(isValidTrackingNumber('***')).toBe(false);
  });

  it('validates carrier length', () => {
    expect(isValidCarrier('Coordinadora')).toBe(true);
    expect(isValidCarrier('x'.repeat(81))).toBe(false);
  });
});
