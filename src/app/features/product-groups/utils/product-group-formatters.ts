const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CO');

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${value < 0 ? '-' : ''}$${formatMillions(Math.abs(value))}`;
  }

  return moneyFormatter.format(value);
}

function formatMillions(value: number): string {
  const millions = Math.round((value / 1_000_000) * 10) / 10;
  const formatted = Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1);

  return `${formatted}M`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)} %`;
}

export function formatDate(value: string): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
