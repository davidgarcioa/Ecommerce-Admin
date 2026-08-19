import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

import {
  CampaignExportContent,
  CampaignExportFormat,
  CampaignExportOptions,
} from '../../models/campaigns-state.model';

@Component({
  selector: 'app-export-campaigns-panel',
  templateUrl: './export-campaigns-panel.html',
  styleUrl: './export-campaigns-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportCampaignsPanelComponent {
  readonly close = output<void>();
  readonly exportCampaigns = output<CampaignExportOptions>();
  readonly format = signal<CampaignExportFormat>('csv');
  readonly content = signal<CampaignExportContent>('campaigns');
  readonly filteredOnly = signal(true);
  readonly includeHiddenColumns = signal(false);
  readonly includeCalculatedMetrics = signal(true);
  readonly includeGeneratedAt = signal(true);

  onFormatChange(event: Event): void {
    this.format.set((event.target as HTMLSelectElement).value as CampaignExportFormat);
  }

  onContentChange(event: Event): void {
    this.content.set((event.target as HTMLSelectElement).value as CampaignExportContent);
  }

  onExport(): void {
    this.exportCampaigns.emit({
      format: this.format(),
      content: this.content(),
      filteredOnly: this.filteredOnly(),
      includeHiddenColumns: this.includeHiddenColumns(),
      includeCalculatedMetrics: this.includeCalculatedMetrics(),
      includeGeneratedAt: this.includeGeneratedAt(),
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
