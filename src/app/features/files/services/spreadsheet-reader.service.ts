import { Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';

import { SpreadsheetWorkbook } from '../models/spreadsheet-sheet.model';
import { SpreadsheetCellValue, SpreadsheetRow } from '../models/spreadsheet-row.model';
import { detectHeaderRow, toSpreadsheetRows } from '../utils/spreadsheet.utils';

@Injectable({ providedIn: 'root' })
export class SpreadsheetReaderService {
  private readonly workbookState = signal<SpreadsheetWorkbook | null>(null);

  readonly workbook = this.workbookState.asReadonly();

  async readWorkbook(file: File): Promise<SpreadsheetWorkbook> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { cellDates: true, type: 'array' });
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const rawRows = XLSX.utils.sheet_to_json<readonly unknown[]>(sheet, {
        blankrows: false,
        defval: null,
        header: 1,
        raw: true,
      });
      const rows = toSpreadsheetRows(
        rawRows.map((row) => row.map((cell) => this.normalizeCell(cell))),
      );
      const columnCount = rows.reduce((max, row) => Math.max(max, row.values.length), 0);

      return {
        name,
        rows,
        rowCount: rows.length,
        columnCount,
        empty: rows.length === 0 || rows.every((row) => row.empty),
      };
    });
    const result: SpreadsheetWorkbook = { fileName: file.name, sheets };
    this.workbookState.set(result);
    return result;
  }

  getSheets(): SpreadsheetWorkbook['sheets'] {
    return this.workbookState()?.sheets ?? [];
  }

  selectSheet(sheetName: string): SpreadsheetWorkbook['sheets'][number] | null {
    return this.getSheets().find((sheet) => sheet.name === sheetName) ?? null;
  }

  readSheet(sheetName: string): readonly SpreadsheetRow[] {
    return this.selectSheet(sheetName)?.rows ?? [];
  }

  detectHeaders(rows: readonly SpreadsheetRow[], aliases: readonly string[]) {
    return detectHeaderRow(rows, aliases);
  }

  normalizeSheetData(rows: readonly SpreadsheetRow[]): readonly SpreadsheetRow[] {
    return rows.filter((row) => !row.empty);
  }

  reset(): void {
    this.workbookState.set(null);
  }

  private normalizeCell(value: unknown): SpreadsheetCellValue {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (value instanceof Date) {
      return value;
    }
    return String(value);
  }
}
