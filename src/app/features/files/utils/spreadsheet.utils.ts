import { HeaderDetectionResult } from '../models/spreadsheet-sheet.model';
import { SpreadsheetCellValue, SpreadsheetRow } from '../models/spreadsheet-row.model';
import { normalizeColumnKey } from './validation.utils';

export function isEmptyCell(value: SpreadsheetCellValue): boolean {
  return value === null || String(value).trim().length === 0;
}

export function toSpreadsheetRows(
  rows: readonly (readonly SpreadsheetCellValue[])[],
): readonly SpreadsheetRow[] {
  return rows.map((values, index) => ({
    rowIndex: index + 1,
    values,
    empty: values.every(isEmptyCell),
  }));
}

export function detectHeaderRow(
  rows: readonly SpreadsheetRow[],
  expectedAliases: readonly string[],
): HeaderDetectionResult {
  const normalizedAliases = expectedAliases.map(normalizeColumnKey);
  const candidates = rows.slice(0, 20).map((row) => {
    const headers = row.values.map((value) => String(value ?? '').trim());
    const textCells = headers.filter((value) => value.length > 0 && Number.isNaN(Number(value)));
    const matches = headers.filter((value) =>
      normalizedAliases.includes(normalizeColumnKey(value)),
    );
    return {
      row,
      headers,
      score: textCells.length + matches.length * 3,
    };
  });
  const best = candidates.reduce((current, candidate) =>
    candidate.score > current.score ? candidate : current,
  );
  const seen = new Set<string>();
  const duplicateHeaders = best.headers.filter((header) => {
    const key = normalizeColumnKey(header);
    if (key.length === 0) {
      return false;
    }
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
    return false;
  });

  return {
    headerRowIndex: best.row.rowIndex,
    confidenceScore: Math.min(100, best.score * 8),
    detectedHeaders: best.headers,
    duplicateHeaders,
    emptyHeaders: best.headers
      .map((header, index) => (header.trim().length === 0 ? index : -1))
      .filter((index) => index >= 0),
  };
}
