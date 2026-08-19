import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-metric-card-skeleton',
  templateUrl: './skeleton-metric-card.html',
  styleUrl: './skeleton-metric-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardSkeletonComponent {}
