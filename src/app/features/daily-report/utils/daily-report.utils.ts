import { DailyMetricFormat } from '../models/daily-metric.model';
import { ReportComparison } from '../models/report-comparison.model';

export function formatDailyValue(value: number, format: DailyMetricFormat): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-CO', {
        currency: 'COP',
        maximumFractionDigits: 0,
        style: 'currency',
      })
        .format(value)
        .replace('COP', '')
        .trim();
    case 'percentage':
      return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value)} %`;
    case 'multiplier':
      return `${new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }).format(value)}x`;
    case 'number':
      return new Intl.NumberFormat('es-CO').format(value);
  }
}

export function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)} *** ${phone.slice(-2)}`;
}

export function buildComparison(
  id: string,
  label: string,
  currentValue: number,
  previousValue: number,
  format: DailyMetricFormat,
  lowerIsBetter = false,
): ReportComparison {
  const difference = currentValue - previousValue;
  const percentageDifference = previousValue === 0 ? 0 : (difference / previousValue) * 100;
  const direction = difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral';
  const improved = lowerIsBetter ? difference < 0 : difference > 0;

  return {
    id,
    label,
    currentValue,
    previousValue,
    formattedCurrentValue: formatDailyValue(currentValue, format),
    formattedPreviousValue: formatDailyValue(previousValue, format),
    difference,
    percentageDifference,
    direction,
    tone: direction === 'neutral' ? 'neutral' : improved ? 'positive' : 'negative',
  };
}

export function escapeCsv(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}
