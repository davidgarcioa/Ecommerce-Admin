import { formatDailyValue } from '../../utils/daily-report.utils';
import { GuideStatusSegment, VisualMetric } from './dashboard-visual-summary.models';

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value / 1_000_000)}M`;
  }

  return formatDailyValue(value, 'currency');
}

export function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function buildMetricDonutBackground(metric: VisualMetric): string {
  const colors: Record<VisualMetric['tone'], string> = {
    amber: 'rgb(245 158 11 / 78%)',
    blue: 'rgb(59 130 246 / 82%)',
    green: 'rgb(16 185 129 / 76%)',
    teal: 'rgb(20 184 166 / 78%)',
  };
  const degrees = metric.percentage * 3.6;

  return `conic-gradient(${colors[metric.tone]} 0deg ${degrees}deg, rgb(255 255 255 / 8%) ${degrees}deg 360deg)`;
}

export function buildGuideDonutBackground(segments: readonly GuideStatusSegment[]): string {
  if (segments.length === 0) {
    return 'conic-gradient(rgb(255 255 255 / 7%) 0deg 360deg)';
  }

  let current = 0;
  const gradientSegments = segments.map((segment) => {
    const start = current;
    current += segment.percentage * 3.6;
    return `${segment.color} ${start}deg ${current}deg`;
  });

  return `conic-gradient(${gradientSegments.join(', ')})`;
}
