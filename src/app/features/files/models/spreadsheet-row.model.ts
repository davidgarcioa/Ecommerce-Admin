export type SpreadsheetCellValue = string | number | boolean | Date | null;

export interface SpreadsheetRow {
  readonly rowIndex: number;
  readonly values: readonly SpreadsheetCellValue[];
  readonly empty: boolean;
}

export interface PreviewRow {
  readonly id: string;
  readonly rowIndex: number;
  readonly cells: string;
}
