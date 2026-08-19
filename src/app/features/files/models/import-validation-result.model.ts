import { RowValidationResult, ValidationIssue } from './row-validation.model';

export interface ImportValidationResult {
  readonly totalRows: number;
  readonly validRows: number;
  readonly warningRows: number;
  readonly errorRows: number;
  readonly excludedRows: number;
  readonly duplicateRows: number;
  readonly fixableIssues: number;
  readonly qualityScore: number;
  readonly rows: readonly RowValidationResult[];
  readonly issues: readonly ValidationIssue[];
}
