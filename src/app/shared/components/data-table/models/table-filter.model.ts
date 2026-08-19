export type TableFilterType =
  'text' | 'select' | 'number-range' | 'date-range' | 'status' | 'boolean';

export type TableFilterValue =
  | string
  | number
  | boolean
  | readonly [number | null, number | null]
  | readonly [string | null, string | null]
  | null;

export interface TableFilterOption {
  readonly label: string;
  readonly value: string | number | boolean;
}

export interface TableFilter<T extends object> {
  readonly key: Extract<keyof T, string>;
  readonly label: string;
  readonly type: TableFilterType;
  readonly value: TableFilterValue;
  readonly options?: readonly TableFilterOption[];
}
