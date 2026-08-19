export function formatColombianCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    currency: 'COP',
    maximumFractionDigits: 0,
    style: 'currency',
  })
    .format(value)
    .replace('COP', '')
    .trim();
}

export function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value)} %`;
}

export function formatMultiplier(value: number): string {
  return `${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}x`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDashboardDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
