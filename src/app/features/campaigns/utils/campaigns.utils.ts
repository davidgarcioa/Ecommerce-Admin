import { DashboardMetric } from '../../dashboard/models/dashboard-metric.model';
import { Campaign } from '../models/campaign.model';
import { CampaignComparison, CampaignComparisonTone } from '../models/campaign-comparison.model';
import { CampaignMetric } from '../models/campaign-metric.model';
import { CampaignStatusSummaryItem } from '../models/campaigns-state.model';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  currency: 'COP',
  maximumFractionDigits: 0,
  style: 'currency',
});

const numberFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const compactDecimalFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null;
  }

  return Number((numerator / denominator).toFixed(2));
}

export function calculateRoas(revenue: number, spent: number): number | null {
  return safeDivide(revenue, spent);
}

export function calculateCpa(spent: number, purchases: number): number | null {
  return safeDivide(spent, purchases);
}

export function calculateCpc(spent: number, clicks: number): number | null {
  return safeDivide(spent, clicks);
}

export function calculateCpm(spent: number, impressions: number): number | null {
  const value = safeDivide(spent * 1000, impressions);
  return value;
}

export function calculateCtr(clicks: number, impressions: number): number | null {
  return safeDivide(clicks * 100, impressions);
}

export function calculateFrequency(impressions: number, reach: number): number | null {
  return safeDivide(impressions, reach);
}

export function formatCampaignValue(
  value: number | null | undefined,
  format: string,
  compactLarge = true,
): string {
  if (value === null || value === undefined) {
    return 'No disponible';
  }

  switch (format) {
    case 'currency':
      if (compactLarge && Math.abs(value) >= 1_000_000) {
        return `$${formatCompactValue(value)}`;
      }

      return currencyFormatter.format(value);
    case 'percentage':
      return `${percentFormatter.format(value)} %`;
    case 'multiplier':
      return `${decimalFormatter.format(value)}x`;
    default:
      if (compactLarge && Math.abs(value) >= 1_000_000) {
        return formatCompactValue(value);
      }

      return numberFormatter.format(value);
  }
}

function formatCompactValue(value: number): string {
  const compact = compactDecimalFormatter.format(value / 1_000_000).replace(/\.0$/, '');
  return `${compact}M`;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function toDashboardMetric(metric: CampaignMetric): DashboardMetric {
  return {
    ...metric,
    footer: null,
    tooltip: null,
    trendDirection: 'neutral',
    trendValue: null,
  };
}

export function interpretAdvertisingComparison(
  id: string,
  current: number,
  previous: number,
): Pick<CampaignComparison, 'absoluteDifference' | 'percentageDifference' | 'direction' | 'tone'> {
  const absoluteDifference = Number((current - previous).toFixed(2));
  const percentageDifference =
    previous === 0 ? 0 : Number(((absoluteDifference / previous) * 100).toFixed(1));
  const direction = absoluteDifference > 0 ? 'up' : absoluteDifference < 0 ? 'down' : 'neutral';
  const lowerIsBetter = ['cpa', 'cpc', 'cpm'].includes(id);
  const neutralSpend = id === 'amountSpent';
  let tone: CampaignComparisonTone = 'neutral';

  if (!neutralSpend && direction !== 'neutral') {
    tone = lowerIsBetter
      ? direction === 'down'
        ? 'positive'
        : 'negative'
      : direction === 'up'
        ? 'positive'
        : 'negative';
  }

  return { absoluteDifference, percentageDifference, direction, tone };
}

export function buildStatusSummary(
  campaigns: readonly Campaign[],
): readonly CampaignStatusSummaryItem[] {
  const total = campaigns.length || 1;
  const statuses = ['Activa', 'Pausada', 'En revisión', 'Finalizada', 'Con errores', 'Archivada'];

  return statuses.map((status) => {
    const items = campaigns.filter((campaign) => campaign.status === status);
    const amountSpent = items.reduce((sum, campaign) => sum + campaign.amountSpent, 0);
    const attributedRevenue = items.reduce((sum, campaign) => sum + campaign.attributedRevenue, 0);
    const roasValues = items
      .map((campaign) => campaign.roas)
      .filter((value): value is number => value !== null);

    return {
      status,
      count: items.length,
      percentage: Number(((items.length / total) * 100).toFixed(1)),
      amountSpent,
      attributedRevenue,
      averageRoas:
        roasValues.length === 0
          ? null
          : Number(
              (roasValues.reduce((sum, value) => sum + value, 0) / roasValues.length).toFixed(2),
            ),
    };
  });
}

export function escapeCsv(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
