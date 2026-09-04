import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { TableColumnSelectorComponent } from './components/table-column-selector/table-column-selector';
import { TableEmptyStateComponent } from './components/table-empty-state/table-empty-state';
import { TableErrorStateComponent } from './components/table-error-state/table-error-state';
import { TablePaginationComponent } from './components/table-pagination/table-pagination';
import { TableRowActionsComponent } from './components/table-row-actions/table-row-actions';
import { TableSkeletonComponent } from './components/table-skeleton/table-skeleton';
import { TableToolbarComponent } from './components/table-toolbar/table-toolbar';
import { TableAction, TableActionClick } from './models/table-action.model';
import { TableColumn } from './models/table-column.model';
import { TableFilter, TableFilterOption, TableFilterValue } from './models/table-filter.model';
import { TablePageChange } from './models/table-pagination.model';
import { TableSort } from './models/table-sort.model';
import {
  createCsvContent,
  downloadCsv,
  filterTableData,
  formatTableCell,
  getNextSortDirection,
  getTableRowId,
  paginateTableData,
  searchTableData,
  sortTableData,
} from './utils/table.utils';

const statusToneCache = new Map<string, string>();

@Component({
  selector: 'app-data-table',
  imports: [
    TableToolbarComponent,
    TablePaginationComponent,
    TableEmptyStateComponent,
    TableErrorStateComponent,
    TableSkeletonComponent,
    TableColumnSelectorComponent,
    TableRowActionsComponent,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends object> {
  readonly data = input.required<readonly T[]>();
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly rowIdKey = input.required<Extract<keyof T, string>>();
  readonly searchable = input(true);
  readonly selectable = input(false);
  readonly multiSelect = input(true);
  readonly sortable = input(true);
  readonly pageable = input(true);
  readonly pageSize = input(20);
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);
  readonly stickyHeader = input(false);
  readonly compact = input(false);
  readonly emptyTitle = input('Sin datos');
  readonly emptyDescription = input('No hay registros disponibles.');
  readonly exportEnabled = input(false);
  readonly columnSelectorEnabled = input(false);
  readonly rowActions = input<readonly TableAction<T>[]>([]);
  readonly filters = input<readonly TableFilter<T>[]>([]);
  readonly preferencesKey = input<string | null>(null);

  readonly rowClick = output<T>();
  readonly selectionChange = output<readonly T[]>();
  readonly sortChange = output<TableSort<T>>();
  readonly pageChange = output<TablePageChange>();
  readonly searchChange = output<string>();
  readonly filterChange = output<readonly TableFilter<T>[]>();
  readonly actionClick = output<TableActionClick<T>>();
  readonly retry = output<void>();
  readonly exportTable = output<string>();

  readonly searchTerm = signal('');
  readonly sort = signal<TableSort<T>>({ key: null, direction: null });
  readonly pageIndex = signal(0);
  readonly currentPageSize = signal(this.pageSize());
  readonly selectedIds = signal<ReadonlySet<string>>(new Set<string>());
  readonly filterPanelVisible = signal(false);
  readonly localFilters = signal<readonly TableFilter<T>[] | null>(null);
  readonly openFilterKey = signal<Extract<keyof T, string> | null>(null);
  readonly columnSelectorVisible = signal(false);
  readonly visibleColumnKeys = signal<readonly Extract<keyof T, string>[]>([]);

  readonly activeFilters = computed(() => this.localFilters() ?? this.filters());

  readonly visibleColumns = computed(() => {
    const selectedKeys = this.visibleColumnKeys();
    const keys =
      selectedKeys.length > 0
        ? selectedKeys
        : this.columns()
            .filter((column) => column.visible)
            .map((column) => column.key);

    return this.columns().filter((column) => keys.includes(column.key));
  });

  readonly visibleColumnKeysForSelector = computed(() =>
    this.visibleColumns().map((column) => column.key),
  );

  readonly filteredData = computed(() => {
    const searched = searchTableData(this.data(), this.visibleColumns(), this.searchTerm());
    const filtered = filterTableData(searched, this.activeFilters());

    return sortTableData(filtered, this.sort());
  });

  readonly pagedData = computed(() => {
    const filteredData = this.filteredData();

    if (!this.pageable()) {
      return filteredData;
    }

    return paginateTableData(filteredData, {
      pageIndex: this.pageIndex(),
      pageSize: this.currentPageSize(),
      totalItems: filteredData.length,
    });
  });

  readonly selectedRows = computed(() =>
    this.data().filter((row) => this.selectedIds().has(getTableRowId(row, this.rowIdKey()))),
  );

  readonly allVisibleSelected = computed(() => {
    const pagedData = this.pagedData();

    return (
      pagedData.length > 0 &&
      pagedData.every((row) => this.selectedIds().has(getTableRowId(row, this.rowIdKey())))
    );
  });

  readonly activeFilterCount = computed(
    () =>
      this.activeFilters().filter((filter) => filter.value !== null && filter.value !== '').length,
  );

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.pageIndex.set(0);
    this.searchChange.emit(term);
  }

  onClearSearch(): void {
    this.onSearchChange('');
  }

  onToggleFilters(): void {
    const nextVisible = !this.filterPanelVisible();

    this.filterPanelVisible.set(nextVisible);
    this.openFilterKey.set(null);

    if (nextVisible) {
      this.columnSelectorVisible.set(false);
    }
  }

  onToggleFilterMenu(filter: TableFilter<T>): void {
    this.openFilterKey.update((currentKey) => (currentKey === filter.key ? null : filter.key));
  }

  onCloseFilterMenus(): void {
    this.openFilterKey.set(null);
  }

  isFilterMenuOpen(filter: TableFilter<T>): boolean {
    return this.openFilterKey() === filter.key;
  }

  getFilterDisplayValue(filter: TableFilter<T>): string {
    if (filter.value === null || filter.value === '') {
      return 'Todos';
    }

    const option = this.getFilterOptions(filter).find((item) => item.value === filter.value);

    return option?.label ?? String(filter.value);
  }

  getFilterOptions(filter: TableFilter<T>): readonly TableFilterOption[] {
    if (filter.type === 'boolean') {
      return [
        { label: 'Sí', value: true },
        { label: 'No', value: false },
      ];
    }

    return filter.options ?? [];
  }

  isFilterOptionSelected(
    filter: TableFilter<T>,
    value: TableFilterOption['value'] | null,
  ): boolean {
    return (
      filter.value === value || (value === null && (filter.value === null || filter.value === ''))
    );
  }

  onFilterOptionSelect(filter: TableFilter<T>, value: TableFilterOption['value'] | null): void {
    const nextFilters = this.activeFilters().map((currentFilter) =>
      currentFilter.key === filter.key ? { ...currentFilter, value } : currentFilter,
    );

    this.localFilters.set(nextFilters);
    this.openFilterKey.set(null);
    this.pageIndex.set(0);
    this.filterChange.emit(nextFilters);
  }

  onFilterValueChange(filter: TableFilter<T>, rawValue: string): void {
    let value: TableFilterValue = rawValue;

    if (rawValue === '') {
      value = null;
    } else if (filter.type === 'boolean') {
      value = rawValue === 'true';
    }

    const nextFilters = this.activeFilters().map((currentFilter) =>
      currentFilter.key === filter.key ? { ...currentFilter, value } : currentFilter,
    );

    this.localFilters.set(nextFilters);
    this.pageIndex.set(0);
    this.filterChange.emit(nextFilters);
  }

  onRangeFilterValueChange(
    filter: TableFilter<T>,
    position: 'from' | 'to',
    rawValue: string,
  ): void {
    const nextRange = buildRangeFilterValue(filter, position, rawValue);
    const nextFilters = this.activeFilters().map((currentFilter) =>
      currentFilter.key === filter.key ? { ...currentFilter, value: nextRange } : currentFilter,
    );

    this.localFilters.set(nextFilters);
    this.pageIndex.set(0);
    this.filterChange.emit(nextFilters);
  }

  onClearFilters(): void {
    const nextFilters = this.activeFilters().map((filter) => ({ ...filter, value: null }));

    this.localFilters.set(nextFilters);
    this.pageIndex.set(0);
    this.filterChange.emit(nextFilters);
  }

  onToggleColumnSelector(): void {
    const nextVisible = !this.columnSelectorVisible();

    this.columnSelectorVisible.set(nextVisible);

    if (nextVisible) {
      this.filterPanelVisible.set(false);
      this.openFilterKey.set(null);
    }
  }

  onVisibleColumnKeysChange(keys: readonly Extract<keyof T, string>[]): void {
    this.visibleColumnKeys.set(keys);
    this.persistPreferences();
  }

  onSort(column: TableColumn<T>): void {
    if (!this.sortable() || !column.sortable) {
      return;
    }

    const currentSort = this.sort();
    const nextDirection =
      currentSort.key === column.key ? getNextSortDirection(currentSort.direction) : 'asc';
    const nextSort: TableSort<T> = {
      key: nextDirection ? column.key : null,
      direction: nextDirection,
    };

    this.sort.set(nextSort);
    this.sortChange.emit(nextSort);
    this.persistPreferences();
  }

  onPageChange(event: TablePageChange): void {
    this.pageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    this.pageChange.emit(event);
    this.persistPreferences();
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  onToggleRow(row: T, event: Event): void {
    event.stopPropagation();
    const rowId = getTableRowId(row, this.rowIdKey());
    const nextSelection = new Set(this.selectedIds());

    if (!this.multiSelect()) {
      nextSelection.clear();
    }

    if (nextSelection.has(rowId)) {
      nextSelection.delete(rowId);
    } else {
      nextSelection.add(rowId);
    }

    this.selectedIds.set(nextSelection);
    this.selectionChange.emit(this.selectedRows());
  }

  onToggleAllVisible(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const nextSelection = new Set(this.selectedIds());
    const pagedData = this.pagedData();

    pagedData.forEach((row) => {
      const rowId = getTableRowId(row, this.rowIdKey());
      if (checked) {
        nextSelection.add(rowId);
      } else {
        nextSelection.delete(rowId);
      }
    });

    this.selectedIds.set(nextSelection);
    this.selectionChange.emit(this.selectedRows());
  }

  onActionClick(event: TableActionClick<T>): void {
    this.actionClick.emit(event);
  }

  onExport(): void {
    const csv = createCsvContent(this.filteredData(), this.visibleColumns());
    const filename = `ordenes-exportadas-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csv);
    this.exportTable.emit(csv);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set<string>());
    this.selectionChange.emit([]);
  }

  isRowSelected(row: T): boolean {
    return this.selectedIds().has(getTableRowId(row, this.rowIdKey()));
  }

  getCellValue(row: T, column: TableColumn<T>): string {
    return formatTableCell(row, column);
  }

  getAriaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' {
    const currentSort = this.sort();

    if (currentSort.key !== column.key || !currentSort.direction) {
      return 'none';
    }

    return currentSort.direction === 'asc' ? 'ascending' : 'descending';
  }

  getStatusTone(value: string): string {
    const cachedTone = statusToneCache.get(value);
    if (cachedTone) {
      return cachedTone;
    }

    const normalizedValue = normalizeStatusValue(value);
    const tone = resolveStatusTone(normalizedValue);

    statusToneCache.set(value, tone);

    return tone;
  }

  private persistPreferences(): void {
    const key = this.preferencesKey();

    if (!key) {
      return;
    }

    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          compact: this.compact(),
          pageSize: this.currentPageSize(),
          sort: this.sort(),
          visibleColumnKeys: this.visibleColumnKeys(),
        }),
      );
    } catch {
      return;
    }
  }
}

function resolveStatusTone(normalizedValue: string): string {
  if (
    normalizedValue.includes('activa') ||
    normalizedValue.includes('activo') ||
    normalizedValue.includes('entregada') ||
    normalizedValue.includes('entregado') ||
    normalizedValue.includes('confirmada') ||
    normalizedValue.includes('confirmado') ||
    normalizedValue.includes('pagado') ||
    normalizedValue.includes('gestionado') ||
    normalizedValue.includes('finalizado')
  ) {
    return 'positive';
  }

  if (
    normalizedValue.includes('transito') ||
    normalizedValue.includes('despachada') ||
    normalizedValue.includes('enviado') ||
    normalizedValue.includes('asignado') ||
    normalizedValue.includes('asignada') ||
    normalizedValue.includes('preparacion')
  ) {
    return 'info';
  }

  if (
    normalizedValue.includes('borrador') ||
    normalizedValue.includes('pausado') ||
    normalizedValue.includes('pendiente') ||
    normalizedValue.includes('urgente') ||
    normalizedValue.includes('sin guia')
  ) {
    return 'warning';
  }

  if (
    normalizedValue.includes('archivado') ||
    normalizedValue.includes('devuelta') ||
    normalizedValue.includes('devuelto') ||
    normalizedValue.includes('fallido') ||
    normalizedValue.includes('novedad') ||
    normalizedValue.includes('cancelada') ||
    normalizedValue.includes('cancelado')
  ) {
    return 'danger';
  }

  return 'neutral';
}

function normalizeStatusValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildRangeFilterValue<T extends object>(
  filter: TableFilter<T>,
  position: 'from' | 'to',
  rawValue: string,
): TableFilterValue {
  if (filter.type === 'number-range') {
    const currentValue = Array.isArray(filter.value)
      ? (filter.value as readonly [number | null, number | null])
      : ([null, null] as const);
    const value = rawValue === '' ? null : Number(rawValue);

    return position === 'from' ? [value, currentValue[1]] : [currentValue[0], value];
  }

  const currentValue = Array.isArray(filter.value)
    ? (filter.value as readonly [string | null, string | null])
    : ([null, null] as const);
  const value = rawValue === '' ? null : rawValue;

  return position === 'from' ? [value, currentValue[1]] : [currentValue[0], value];
}
