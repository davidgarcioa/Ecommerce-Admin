import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-campaigns-header',
  templateUrl: './campaigns-header.html',
  styleUrl: './campaigns-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsHeaderComponent {
  readonly lastSynchronization = input.required<string>();
  readonly adAccountName = input.required<string>();
  readonly periodLabel = input.required<string>();
  readonly loading = input.required<boolean>();
  readonly filtersOpen = input(false);
  readonly synchronize = output<void>();
  readonly createCampaign = output<void>();
  readonly toggleFilters = output<void>();

  formatLastSync(value: string): string {
    if (!value) return 'Sin sincronización';

    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
