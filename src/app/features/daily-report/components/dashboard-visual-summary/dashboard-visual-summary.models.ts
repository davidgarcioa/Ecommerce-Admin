export interface VisualMetric {
  readonly label: string;
  readonly compactValue: string;
  readonly helper: string;
  readonly percentage: number;
  readonly tone: 'blue' | 'green' | 'amber' | 'teal';
}

export interface ProductShare {
  readonly id: string;
  readonly name: string;
  readonly sales: string;
  readonly percentage: number;
  readonly percentageLabel: string;
}

export interface GuideStatusOption {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

export interface GuideStatusSegment extends GuideStatusOption {
  readonly color: string;
  readonly percentage: number;
  readonly tooltip: string;
}

export interface GuideStatusPreferences {
  readonly selectedStatusIds: readonly string[];
  readonly statusColors: Readonly<Record<string, string>>;
}
