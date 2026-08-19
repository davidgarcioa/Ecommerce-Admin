import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImportHistoryRecord } from '../../models/import-history-record.model';

@Component({
  selector: 'app-import-detail-drawer',
  templateUrl: './import-detail-drawer.html',
  styleUrl: './import-detail-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDetailDrawerComponent {
  readonly record = input.required<ImportHistoryRecord>();
  readonly close = output<void>();
  readonly retry = output<void>();
  readonly delete = output<string>();

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
