export type TableActionVariant = 'default' | 'primary' | 'danger';

export interface TableAction<T extends object> {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly variant: TableActionVariant;
  readonly disabled?: boolean | ((row: T) => boolean);
  readonly hidden?: boolean | ((row: T) => boolean);
  readonly confirmationRequired?: boolean;
  readonly confirmationMessage?: string;
}

export interface TableActionClick<T extends object> {
  readonly action: TableAction<T>;
  readonly row: T;
}
