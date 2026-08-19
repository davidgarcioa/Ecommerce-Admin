import { calculateCpa, calculateRoas, formatCampaignValue } from './campaigns.utils';

describe('campaigns utils', () => {
  it('should calculate roas correctly', () => {
    expect(calculateRoas(8350895, 2304618)).toBe(3.62);
  });

  it('should handle cpa division by zero', () => {
    expect(calculateCpa(100000, 0)).toBeNull();
  });

  it('should format large campaign values in compact millions', () => {
    expect(formatCampaignValue(5_000_000, 'currency')).toBe('$5M');
    expect(formatCampaignValue(5_600_000, 'currency')).toBe('$5.6M');
    expect(formatCampaignValue(12_400_000, 'number')).toBe('12.4M');
    expect(formatCampaignValue(5_600_000, 'currency', false)).toContain('5.600.000');
  });
});
