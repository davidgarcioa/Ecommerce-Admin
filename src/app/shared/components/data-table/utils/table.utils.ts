import { TableColumn } from '../models/table-column.model';
import { TableFilter, TableFilterValue } from '../models/table-filter.model';
import { TablePagination } from '../models/table-pagination.model';
import { TableSort } from '../models/table-sort.model';

export function normalizeTableText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getTableRowId<T extends object>(
  row: T,
  rowIdKey: Extract<keyof T, string>,
): string {
  return String(row[rowIdKey]);
}

export function searchTableData<T extends object>(
  data: readonly T[],
  columns: readonly TableColumn<T>[],
  searchTerm: string,
): readonly T[] {
  const normalizedTerm = normalizeTableText(searchTerm);

  if (!normalizedTerm) {
    return data;
  }

  const searchableColumns = columns.filter((column) => column.searchable && column.visible);

  return data.filter((row) =>
    searchableColumns.some((column) =>
      normalizeTableText(row[column.key]).includes(normalizedTerm),
    ),
  );
}

export function filterTableData<T extends object>(
  data: readonly T[],
  filters: readonly TableFilter<T>[],
): readonly T[] {
  const activeFilters = filters.filter((filter) => hasFilterValue(filter.value));

  if (activeFilters.length === 0) {
    return data;
  }

  return data.filter((row) =>
    activeFilters.every((filter) => {
      const value = row[filter.key];

      switch (filter.type) {
        case 'text':
        case 'select':
        case 'status':
          return normalizeTableText(value) === normalizeTableText(filter.value);
        case 'boolean':
          return Boolean(value) === filter.value;
        case 'number-range': {
          const [min, max] = filter.value as readonly [number | null, number | null];
          const numericValue = Number(value);
          return (min === null || numericValue >= min) && (max === null || numericValue <= max);
        }
        case 'date-range': {
          const [from, to] = filter.value as readonly [string | null, string | null];
          const dateValue = new Date(String(value)).getTime();
          return (
            (from === null || dateValue >= new Date(from).getTime()) &&
            (to === null || dateValue <= new Date(to).getTime())
          );
        }
      }
    }),
  );
}

export function sortTableData<T extends object>(
  data: readonly T[],
  sort: TableSort<T>,
): readonly T[] {
  if (!sort.key || !sort.direction) {
    return data;
  }

  return [...data].sort((first, second) => {
    const comparison = compareTableValues(first[sort.key as keyof T], second[sort.key as keyof T]);
    return sort.direction === 'asc' ? comparison : comparison * -1;
  });
}

export function paginateTableData<T extends object>(
  data: readonly T[],
  pagination: TablePagination,
): readonly T[] {
  const start = pagination.pageIndex * pagination.pageSize;

  return data.slice(start, start + pagination.pageSize);
}

export function formatTableCell<T extends object>(row: T, column: TableColumn<T>): string {
  const value = row[column.key];

  if (column.formatter) {
    return column.formatter(value, row);
  }

  switch (column.type) {
    case 'number':
      return new Intl.NumberFormat('es-CO').format(Number(value));
    case 'currency':
      return new Intl.NumberFormat('es-CO', {
        currency: 'COP',
        maximumFractionDigits: 0,
        style: 'currency',
      })
        .format(Number(value))
        .replace('COP', '')
        .trim();
    case 'percentage':
      return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(Number(value))} %`;
    case 'date':
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(String(value)));
    case 'boolean':
      return Boolean(value) ? 'Sí' : 'No';
    case 'status':
    case 'custom':
    case 'text':
      return String(value ?? '');
  }
}

export function createCsvContent<T extends object>(
  data: readonly T[],
  columns: readonly TableColumn<T>[],
): string {
  const visibleColumns = columns.filter((column) => column.visible);
  const header = visibleColumns.map((column) => escapeCsvValue(column.label)).join(',');
  const rows = data.map((row) =>
    visibleColumns.map((column) => escapeCsvValue(formatTableCell(row, column))).join(','),
  );

  return ['\uFEFF' + header, ...rows].join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getNextSortDirection(
  currentDirection: 'asc' | 'desc' | null,
): 'asc' | 'desc' | null {
  if (currentDirection === null) {
    return 'asc';
  }

  if (currentDirection === 'asc') {
    return 'desc';
  }

  return null;
}

function hasFilterValue(value: TableFilterValue): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => item !== null && item !== '');
  }

  return value !== null && value !== '';
}

function compareTableValues(first: unknown, second: unknown): number {
  const firstDate = Date.parse(String(first));
  const secondDate = Date.parse(String(second));

  if (!Number.isNaN(firstDate) && !Number.isNaN(secondDate)) {
    return firstDate - secondDate;
  }

  if (typeof first === 'number' && typeof second === 'number') {
    return first - second;
  }

  return normalizeTableText(first).localeCompare(normalizeTableText(second), 'es');
}

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');

  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}
