import { TableFilter } from './table-filter.model';
import { TablePagination } from './table-pagination.model';
import { TableSort } from './table-sort.model';

export interface TableState<T extends object> {
  readonly searchTerm: string;
  readonly filters: readonly TableFilter<T>[];
  readonly sort: TableSort<T>;
  readonly pagination: TablePagination;
  readonly selectedIds: ReadonlySet<string>;
  readonly visibleColumnKeys: readonly Extract<keyof T, string>[];
  readonly compact: boolean;
}

export interface TablePreferences<T extends object> {
  readonly visibleColumnKeys: readonly Extract<keyof T, string>[];
  readonly pageSize: number;
  readonly sort: TableSort<T>;
  readonly compact: boolean;
}
