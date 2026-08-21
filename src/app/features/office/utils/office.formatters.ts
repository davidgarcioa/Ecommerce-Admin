const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CO');

export function formatCurrency(value: number): string {
  return moneyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    const compactValue = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
    })
      .format(value / 1_000_000)
      .replace(/\.0$/, '');

    return `$${compactValue}M`;
  }

  return formatCurrency(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function maskPhone(value: string): string {
  if (value.length <= 4) {
    return value;
  }

  return `${value.slice(0, 4)}****${value.slice(-2)}`;
}
