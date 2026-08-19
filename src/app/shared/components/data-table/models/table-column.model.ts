import { TemplateRef } from '@angular/core';

export type TableColumnType =
  'text' | 'number' | 'currency' | 'percentage' | 'date' | 'status' | 'boolean' | 'custom';

export type TableColumnAlign = 'left' | 'center' | 'right';

export interface TableColumn<T extends object> {
  readonly key: Extract<keyof T, string>;
  readonly label: string;
  readonly type: TableColumnType;
  readonly sortable: boolean;
  readonly searchable: boolean;
  readonly visible: boolean;
  readonly width?: string;
  readonly minWidth?: string;
  readonly align: TableColumnAlign;
  readonly formatter?: (value: T[Extract<keyof T, string>], row: T) => string;
  readonly cellClass?: string;
  readonly headerClass?: string;
  readonly tooltip?: string;
  readonly sticky?: boolean;
  readonly ariaLabel?: string;
  readonly template?: TemplateRef<{
    readonly $implicit: T;
    readonly value: T[Extract<keyof T, string>];
  }>;
}
