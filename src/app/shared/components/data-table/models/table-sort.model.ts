export type TableSortDirection = 'asc' | 'desc' | null;

export interface TableSort<T extends object> {
  readonly key: Extract<keyof T, string> | null;
  readonly direction: TableSortDirection;
}
