import { SpreadsheetRow } from './spreadsheet-row.model';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  readonly id: string;
  readonly rowIndex: number;
  readonly columnKey?: string;
  readonly sourceColumn?: string;
  readonly severity: ValidationSeverity;
  readonly code: string;
  readonly message: string;
  readonly originalValue: string;
  readonly suggestedValue?: string;
  readonly autoFixAvailable: boolean;
  readonly excluded: boolean;
}

export interface RowValidationResult {
  readonly rowIndex: number;
  readonly originalRow: SpreadsheetRow;
  readonly normalizedRow: Readonly<Record<string, string | number | boolean | null>>;
  readonly valid: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly excluded: boolean;
  readonly corrected: boolean;
}
