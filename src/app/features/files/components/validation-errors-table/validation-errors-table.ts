import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { ValidationIssue } from '../../models/row-validation.model';

@Component({
  selector: 'app-validation-errors-table',
  imports: [DataTableComponent],
  templateUrl: './validation-errors-table.html',
  styleUrl: './validation-errors-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationErrorsTableComponent {
  readonly issues = input.required<readonly ValidationIssue[]>();
  readonly actionClick = output<TableActionClick<ValidationIssue>>();
  readonly columns: readonly TableColumn<ValidationIssue>[] = [
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
      key: 'sourceColumn',
      label: 'Columna',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'originalValue',
      label: 'Valor original',
      type: 'text',
      sortable: false,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'message',
      label: 'Problema',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
      minWidth: '18rem',
    },
    {
      key: 'suggestedValue',
      label: 'Sugerido',
      type: 'text',
      sortable: false,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'autoFixAvailable',
      label: 'Corregible',
      type: 'boolean',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'center',
    },
    {
      key: 'excluded',
      label: 'Excluida',
      type: 'boolean',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'center',
    },
  ];
  readonly actions: readonly TableAction<ValidationIssue>[] = [
    {
      id: 'fix',
      label: 'Aplicar corrección',
      icon: 'auto_fix_high',
      variant: 'default',
      hidden: (row) => !row.autoFixAvailable,
    },
    {
      id: 'exclude',
      label: 'Excluir fila',
      icon: 'block',
      variant: 'default',
      hidden: (row) => row.excluded,
    },
    {
      id: 'restore',
      label: 'Restaurar fila',
      icon: 'restore',
      variant: 'default',
      hidden: (row) => !row.excluded,
    },
  ];
}
