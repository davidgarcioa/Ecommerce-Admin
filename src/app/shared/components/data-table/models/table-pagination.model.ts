export interface TablePagination {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly totalItems: number;
}

export interface TablePageChange {
  readonly pageIndex: number;
  readonly pageSize: number;
}
