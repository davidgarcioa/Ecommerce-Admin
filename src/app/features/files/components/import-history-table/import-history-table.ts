import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { ImportHistoryRecord } from '../../models/import-history-record.model';

@Component({
  selector: 'app-import-history-table',
  imports: [DataTableComponent],
  templateUrl: './import-history-table.html',
  styleUrl: './import-history-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportHistoryTableComponent {
  readonly records = input.required<readonly ImportHistoryRecord[]>();
  readonly actionClick = output<TableActionClick<ImportHistoryRecord>>();
  readonly rowClick = output<ImportHistoryRecord>();
  readonly columns: readonly TableColumn<ImportHistoryRecord>[] = [
    {
      key: 'id',
      label: 'Identificador',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'left',
    },
    {
      key: 'typeName',
      label: 'Tipo',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'fileName',
      label: 'Archivo',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
      minWidth: '14rem',
    },
    {
      key: 'sheetName',
      label: 'Hoja',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'processedRows',
      label: 'Procesados',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
    },
    {
      key: 'successfulRows',
      label: 'Exitosos',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
    },
    {
      key: 'omittedRows',
      label: 'Omitidos',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
    },
    {
      key: 'errorCount',
      label: 'Errores',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'durationMs',
      label: 'Duración',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
    },
    {
      key: 'source',
      label: 'Fuente',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
  ];
  readonly actions: readonly TableAction<ImportHistoryRecord>[] = [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    { id: 'retry', label: 'Reintentar', icon: 'refresh', variant: 'default' },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      variant: 'danger',
      confirmationRequired: true,
      confirmationMessage: 'Eliminar este registro del historial?',
    },
  ];
}

