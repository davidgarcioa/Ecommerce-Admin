export type ImportTypeId =
  | 'orders'
  | 'deliveries'
  | 'returns'
  | 'expenses'
  | 'campaigns'
  | 'products'
  | 'product-groups'
  | 'inventory'
  | 'collections';

export type ImportFileExtension = 'xlsx' | 'xls' | 'csv';

export interface ImportType {
  readonly id: ImportTypeId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly acceptedExtensions: readonly ImportFileExtension[];
  readonly requiredColumns: readonly string[];
  readonly optionalColumns: readonly string[];
  readonly maximumFileSize: number;
  readonly supportsMultipleSheets: boolean;
  readonly templateId: string;
  readonly enabled: boolean;
}
