import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

import { IMPORT_TYPES } from '../constants/files.constants';
import { ImportTemplate } from '../models/import-template.model';
import { escapeCsv } from '../utils/import-export.utils';

@Injectable({ providedIn: 'root' })
export class TemplateGeneratorService {
  readonly templates: readonly ImportTemplate[] = IMPORT_TYPES.map((type) => ({
    id: type.templateId,
    typeId: type.id,
    name: `Plantilla de ${type.name}`,
    description: type.description,
    requiredColumns: type.requiredColumns,
    optionalColumns: type.optionalColumns,
    updatedAt: new Date().toISOString(),
    formats: ['csv', 'xlsx'],
    exampleRow: [],
  }));

  getTemplate(templateId: string): ImportTemplate | null {
    return this.templates.find((template) => template.id === templateId) ?? null;
  }

  createCsvTemplate(template: ImportTemplate): string {
    const headers = [...template.requiredColumns, ...template.optionalColumns];
    return '\uFEFF' + headers.map(escapeCsv).join(',');
  }

  createXlsxTemplate(template: ImportTemplate): Blob {
    const headers = [...template.requiredColumns, ...template.optionalColumns];
    const workbook = XLSX.utils.book_new();
    const dataSheet = XLSX.utils.aoa_to_sheet([headers]);
    const instructionsSheet = XLSX.utils.aoa_to_sheet([
      ['Plantilla', template.name],
      ['Descripción', template.description],
      ['Procesamiento', 'Validar antes de guardar en la base de datos.'],
    ]);
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos');
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
    const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    return new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}

