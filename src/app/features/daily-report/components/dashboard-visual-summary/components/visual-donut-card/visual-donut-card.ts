import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, signal } from '@angular/core';

import { AnimateOnViewDirective } from '../../../../../../shared/directives/animate-on-view.directive';
import { VisualMetric } from '../../dashboard-visual-summary.models';
import { buildMetricDonutBackground } from '../../dashboard-visual-summary.utils';

@Component({
  selector: 'app-visual-donut-card',
  imports: [AnimateOnViewDirective],
  templateUrl: './visual-donut-card.html',
  styleUrl: './visual-donut-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualDonutCardComponent implements OnDestroy {
  readonly metric = input.required<VisualMetric>();
  readonly compact = input(false);
  private animationFrameId: number | null = null;
  readonly hasEnteredView = signal(false);
  readonly animatedPercentage = signal(0);
  readonly donutBackground = computed(() =>
    buildMetricDonutBackground({
      ...this.metric(),
      percentage: this.hasEnteredView() ? this.animatedPercentage() : this.metric().percentage,
    }),
  );

  constructor() {
    effect(() => {
      const targetPercentage = this.metric().percentage;

      if (this.hasEnteredView()) {
        this.animatePercentage(targetPercentage);
      } else {
        this.animatedPercentage.set(0);
      }
    });
  }

  onVisible(): void {
    this.hasEnteredView.set(true);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private animatePercentage(targetPercentage: number): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const duration = 850;
    const startedAt = performance.now();

    const tick = (time: number): void => {
      const progress = Math.min((time - startedAt) / duration, 1);
      this.animatedPercentage.set(targetPercentage * easeOutCubic(progress));

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    this.animatedPercentage.set(0);
    this.animationFrameId = requestAnimationFrame(tick);
  }
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}
