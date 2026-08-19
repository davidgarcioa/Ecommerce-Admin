import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MetaAdsPreview } from '../../data-access/integrations.models';

@Component({
  selector: 'app-meta-ads-preview',
  templateUrl: './meta-ads-preview.html',
  styleUrl: './meta-ads-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaAdsPreviewComponent {
  readonly preview = input.required<MetaAdsPreview>();

  formatCompactNumber(value: number | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value ?? 0);
  }

  formatCurrency(value: number | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }
}
