import { SpreadsheetRow } from './spreadsheet-row.model';

export interface SpreadsheetSheet {
  readonly name: string;
  readonly rows: readonly SpreadsheetRow[];
  readonly rowCount: number;
  readonly columnCount: number;
  readonly empty: boolean;
}

export interface SpreadsheetWorkbook {
  readonly fileName: string;
  readonly sheets: readonly SpreadsheetSheet[];
}

export interface HeaderDetectionResult {
  readonly headerRowIndex: number;
  readonly confidenceScore: number;
  readonly detectedHeaders: readonly string[];
  readonly duplicateHeaders: readonly string[];
  readonly emptyHeaders: readonly number[];
}
