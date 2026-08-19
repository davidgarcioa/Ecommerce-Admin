import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { HeaderDetectionResult } from '../../models/spreadsheet-sheet.model';
import { PreviewRow } from '../../models/spreadsheet-row.model';

@Component({
  selector: 'app-data-preview-table',
  imports: [DataTableComponent],
  templateUrl: './data-preview-table.html',
  styleUrl: './data-preview-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataPreviewTableComponent {
  readonly rows = input.required<readonly PreviewRow[]>();
  readonly headerDetection = input<HeaderDetectionResult | null>(null);
  readonly setHeaderRow = output<number>();

  readonly columns: readonly TableColumn<PreviewRow>[] = [
    {
      key: 'rowIndex',
      label: 'Fila',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
    },
    {
      key: 'cells',
      label: 'Celdas detectadas',
      type: 'text',
      sortable: false,
      searchable: true,
      visible: true,
      align: 'left',
      minWidth: '36rem',
    },
  ];
}
