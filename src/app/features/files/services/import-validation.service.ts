import { Injectable } from '@angular/core';

import { ALLOWED_ORDER_STATUSES } from '../constants/files.constants';
import { ColumnMapping } from '../models/column-mapping.model';
import { ImportColumnDefinition } from '../models/import-column.model';
import { ImportValidationResult } from '../models/import-validation-result.model';
import { RowValidationResult, ValidationIssue } from '../models/row-validation.model';
import { SpreadsheetRow } from '../models/spreadsheet-row.model';
import {
  normalizeBoolean,
  normalizeCurrency,
  normalizeDate,
  normalizeEmail,
  normalizePhone,
  normalizeText,
} from '../utils/validation.utils';

@Injectable({ providedIn: 'root' })
export class ImportValidationService {
  validateRows(
    rows: readonly SpreadsheetRow[],
    headerRowIndex: number,
    headers: readonly string[],
    definitions: readonly ImportColumnDefinition[],
    mappings: readonly ColumnMapping[],
  ): ImportValidationResult {
    const dataRows = rows.filter((row) => row.rowIndex > headerRowIndex && !row.empty);
    const seenUniqueValues = new Map<string, Set<string>>();
    const validationRows = dataRows.map((row) =>
      this.validateRow(row, headers, definitions, mappings, seenUniqueValues),
    );
    const issues = validationRows.flatMap((row) => [...row.errors, ...row.warnings]);
    const errorRows = validationRows.filter((row) => row.errors.length > 0 && !row.excluded).length;
    const warningRows = validationRows.filter(
      (row) => row.warnings.length > 0 && !row.excluded,
    ).length;
    const excludedRows = validationRows.filter((row) => row.excluded).length;
    const validRows = validationRows.filter((row) => row.valid && !row.excluded).length;
    const qualityScore =
      dataRows.length === 0
        ? 0
        : Math.max(0, Math.round(((validRows + warningRows * 0.6) / dataRows.length) * 100));

    return {
      totalRows: dataRows.length,
      validRows,
      warningRows,
      errorRows,
      excludedRows,
      duplicateRows: issues.filter((issue) => issue.code === 'duplicate').length,
      fixableIssues: issues.filter((issue) => issue.autoFixAvailable).length,
      qualityScore,
      rows: validationRows,
      issues,
    };
  }

  applyAutoFix(issue: ValidationIssue): ValidationIssue {
    return {
      ...issue,
      originalValue: issue.suggestedValue ?? issue.originalValue,
      autoFixAvailable: false,
    };
  }

  private validateRow(
    row: SpreadsheetRow,
    headers: readonly string[],
    definitions: readonly ImportColumnDefinition[],
    mappings: readonly ColumnMapping[],
    seenUniqueValues: Map<string, Set<string>>,
  ): RowValidationResult {
    const normalizedRow: Record<string, string | number | boolean | null> = {};
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    definitions.forEach((definition) => {
      const mapping = mappings.find((item) => item.systemColumnKey === definition.key);
      const sourceIndex = mapping?.sourceColumnName
        ? headers.findIndex((header) => header === mapping.sourceColumnName)
        : -1;
      const rawValue = sourceIndex >= 0 ? row.values[sourceIndex] : null;
      const normalizedValue = this.normalizeValue(definition, rawValue);
      normalizedRow[definition.key] = normalizedValue;

      if (
        definition.required &&
        (normalizedValue === null || String(normalizedValue).trim().length === 0)
      ) {
        errors.push(
          this.issue(
            row.rowIndex,
            definition.key,
            mapping?.sourceColumnName,
            'required',
            this.getRequiredMessage(definition, rawValue),
            rawValue,
          ),
        );
      }

      if (definition.unique && normalizedValue !== null) {
        const value = String(normalizedValue);
        const seen = seenUniqueValues.get(definition.key) ?? new Set<string>();
        if (seen.has(value)) {
          errors.push(
            this.issue(
              row.rowIndex,
              definition.key,
              mapping?.sourceColumnName,
              'duplicate',
              'Valor duplicado dentro del archivo.',
              rawValue,
            ),
          );
        }
        seen.add(value);
        seenUniqueValues.set(definition.key, seen);
      }

      if (definition.dataType === 'email' && rawValue && normalizedValue === null) {
        warnings.push(
          this.issue(
            row.rowIndex,
            definition.key,
            mapping?.sourceColumnName,
            'email',
            'Correo con formato inválido.',
            rawValue,
            'warning',
          ),
        );
      }
      if (definition.dataType === 'phone' && rawValue && normalizedValue === null) {
        warnings.push(
          this.issue(
            row.rowIndex,
            definition.key,
            mapping?.sourceColumnName,
            'phone',
            'Teléfono fuera del rango permitido.',
            rawValue,
            'warning',
          ),
        );
      }
      if (
        definition.key === 'status' &&
        normalizedValue &&
        !this.isAllowedStatus(String(normalizedValue))
      ) {
        errors.push(
          this.issue(
            row.rowIndex,
            definition.key,
            mapping?.sourceColumnName,
            'status',
            'Estado no permitido.',
            rawValue,
          ),
        );
      }
    });

    return {
      rowIndex: row.rowIndex,
      originalRow: row,
      normalizedRow,
      valid: errors.length === 0,
      errors,
      warnings,
      excluded: false,
      corrected: false,
    };
  }

  private normalizeValue(
    definition: ImportColumnDefinition,
    value: unknown,
  ): string | number | boolean | null {
    switch (definition.dataType) {
      case 'currency':
      case 'number':
      case 'percentage':
        return normalizeCurrency(value);
      case 'date':
        return normalizeDate(value);
      case 'boolean':
        return normalizeBoolean(value);
      case 'email':
        return normalizeEmail(value);
      case 'phone':
        return normalizePhone(value);
      case 'status':
      case 'text':
      default:
        return String(value ?? '').trim();
    }
  }

  private getRequiredMessage(definition: ImportColumnDefinition, value: unknown): string {
    const hasValue = String(value ?? '').trim().length > 0;

    if (hasValue && definition.dataType === 'date') {
      return 'Formato de fecha no reconocido.';
    }

    if (hasValue && ['currency', 'number'].includes(definition.dataType)) {
      return 'Formato numérico no reconocido.';
    }

    return 'Campo obligatorio sin valor.';
  }

  private isAllowedStatus(value: string): boolean {
    const normalizedValue = normalizeText(value);
    return ALLOWED_ORDER_STATUSES.some((status) => normalizeText(status) === normalizedValue);
  }

  private issue(
    rowIndex: number,
    columnKey: string,
    sourceColumn: string | undefined,
    code: string,
    message: string,
    originalValue: unknown,
    severity: 'error' | 'warning' = 'error',
  ): ValidationIssue {
    const textValue = String(originalValue ?? '');
    return {
      id: `${rowIndex}-${columnKey}-${code}`,
      rowIndex,
      columnKey,
      sourceColumn,
      severity,
      code,
      message,
      originalValue: textValue,
      suggestedValue: normalizeText(textValue),
      autoFixAvailable: textValue.trim() !== textValue,
      excluded: false,
    };
  }
}
