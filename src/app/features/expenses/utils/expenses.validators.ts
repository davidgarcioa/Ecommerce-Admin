export function normalizeExpenseText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function isFinitePositiveAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isValidExpenseDateRange(dateFrom: string, dateTo: string): boolean {
  if (!dateFrom || !dateTo) return true;
  return dateFrom <= dateTo;
}
