import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

import {
  ReportExportContent,
  ReportExportFormat,
  ReportExportOptions,
} from '../../models/daily-report.model';

@Component({
  selector: 'app-report-export-panel',
  templateUrl: './report-export-panel.html',
  styleUrl: './report-export-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportExportPanelComponent {
  readonly close = output<void>();
  readonly exportReport = output<ReportExportOptions>();
  readonly format = signal<ReportExportFormat>('csv');
  readonly content = signal<ReportExportContent>('orders');
  readonly filteredOnly = signal(true);
  readonly includeHiddenColumns = signal(false);
  readonly includeGeneratedAt = signal(true);

  onFormatChange(event: Event): void {
    this.format.set((event.target as HTMLSelectElement).value as ReportExportFormat);
  }

  onContentChange(event: Event): void {
    this.content.set((event.target as HTMLSelectElement).value as ReportExportContent);
  }

  onExport(): void {
    this.exportReport.emit({
      format: this.format(),
      content: this.content(),
      filteredOnly: this.filteredOnly(),
      includeHiddenColumns: this.includeHiddenColumns(),
      includeGeneratedAt: this.includeGeneratedAt(),
    });
  }
}
