import { describe, expect, it } from 'vitest';

import { formatHomeDate, getHomeGreeting } from './home-date.utils';

describe('home date utils', () => {
  it('returns morning greeting', () => {
    expect(getHomeGreeting(new Date('2026-07-30T08:00:00'))).toBe('Buenos días');
  });

  it('returns afternoon greeting', () => {
    expect(getHomeGreeting(new Date('2026-07-30T14:00:00'))).toBe('Buenas tardes');
  });

  it('returns night greeting', () => {
    expect(getHomeGreeting(new Date('2026-07-30T20:00:00'))).toBe('Buenas noches');
  });

  it('formats date with numeric day, month and year', () => {
    expect(formatHomeDate(new Date('2026-07-30T12:00:00'))).toBe('30/07/2026');
  });
});
