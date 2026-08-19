import { ValidationIssue } from '../models/row-validation.model';

export function escapeCsv(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

export function createValidationErrorsCsv(issues: readonly ValidationIssue[]): string {
  const header = [
    'Fila',
    'Columna',
    'Código',
    'Mensaje',
    'Valor original',
    'Valor sugerido',
    'Estado',
    'Excluida',
  ];
  const rows = issues.map((issue) =>
    [
      issue.rowIndex,
      issue.sourceColumn ?? issue.columnKey ?? '',
      issue.code,
      issue.message,
      issue.originalValue,
      issue.suggestedValue ?? '',
      issue.autoFixAvailable ? 'Corregible' : 'Manual',
      issue.excluded,
    ]
      .map(escapeCsv)
      .join(','),
  );

  return ['\uFEFF' + header.map(escapeCsv).join(','), ...rows].join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
