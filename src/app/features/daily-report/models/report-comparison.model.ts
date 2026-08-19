export type ComparisonDirection = 'up' | 'down' | 'neutral';
export type ComparisonTone = 'positive' | 'negative' | 'neutral';

export interface ReportComparison {
  readonly id: string;
  readonly label: string;
  readonly currentValue: number;
  readonly previousValue: number;
  readonly formattedCurrentValue: string;
  readonly formattedPreviousValue: string;
  readonly difference: number;
  readonly percentageDifference: number;
  readonly direction: ComparisonDirection;
  readonly tone: ComparisonTone;
}
