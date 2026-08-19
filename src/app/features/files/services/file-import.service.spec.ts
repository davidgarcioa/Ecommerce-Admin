import { TestBed } from '@angular/core/testing';

import { IMPORT_TYPES } from '../constants/files.constants';
import { ColumnMappingService } from './column-mapping.service';
import { FileImportService } from './file-import.service';
import { ImportValidationService } from './import-validation.service';
import { TemplateGeneratorService } from './template-generator.service';

describe('FileImportService', () => {
  let service: FileImportService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileImportService);
  });

  it('should select import type', () => {
    service.selectImportType(IMPORT_TYPES[1]);

    expect(service.selectedImportType()?.id).toBe(IMPORT_TYPES[1].id);
    expect(service.currentStep()).toBe('file');
  });

  it('should reject invalid file extension', () => {
    service.setFile(new File(['x'], 'archivo.txt'));

    expect(service.importedFile()?.status).toBe('invalid');
    expect(service.error()).toContain('.xlsx');
  });

  it('should confirm import and create history when rows are valid', async () => {
    const file = new File(
      [
        'Orden,Fecha,Cliente,Producto,Ciudad,Estado,Valor\nORD-1,2026-07-29,Ana,Producto,Bogotá,Entregada,100000',
      ],
      'ordenes.csv',
      { type: 'text/csv' },
    );
    const initialHistory = service.importHistory().length;

    service.setFile(file);
    await service.readFile();
    service.validateRows();
    service.setConfirmationAccepted(true);
    service.confirmImport();

    expect(service.importResult()?.importedRows).toBe(1);
    expect(service.importHistory().length).toBe(initialHistory + 1);
  });
});

describe('file import helper services', () => {
  it('should map columns automatically and avoid duplicates', () => {
    const service = new ColumnMappingService();
    const mappings = service.generateMappings(
      [
        {
          key: 'orderNumber',
          label: 'Número de orden',
          description: '',
          required: true,
          dataType: 'text',
          acceptedAliases: ['orden'],
          example: '',
          unique: true,
          nullable: false,
          validatorIds: [],
        },
      ],
      ['orden'],
    );

    expect(mappings[0].sourceColumnName).toBe('orden');
  });

  it('should validate required fields and duplicates', () => {
    const validator = new ImportValidationService();
    const rows = [
      { rowIndex: 1, values: ['Orden'], empty: false },
      { rowIndex: 2, values: ['ORD-1'], empty: false },
      { rowIndex: 3, values: ['ORD-1'], empty: false },
    ];
    const result = validator.validateRows(
      rows,
      1,
      ['Orden'],
      [
        {
          key: 'orderNumber',
          label: 'Orden',
          description: '',
          required: true,
          dataType: 'text',
          acceptedAliases: ['orden'],
          example: '',
          unique: true,
          nullable: false,
          validatorIds: ['required', 'unique'],
        },
      ],
      [
        {
          systemColumnKey: 'orderNumber',
          sourceColumnName: 'Orden',
          confidence: 100,
          manuallySelected: false,
          status: 'mapped',
        },
      ],
    );

    expect(result.duplicateRows).toBe(1);
  });

  it('should generate templates', () => {
    const generator = new TemplateGeneratorService();
    const template = generator.templates[0];

    expect(generator.createCsvTemplate(template)).toContain(template.requiredColumns[0]);
  });
});
