import { TestBed } from '@angular/core/testing';

import { CAMPAIGN_STORAGE_KEY } from '../../campaigns/constants/campaigns.constants';
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

  it('should import Meta Ads files into local campaign data', async () => {
    const csv = [
      [
        'Campaign name',
        'Campaign ID',
        'Amount spent',
        'Purchase conversion value',
        'Impressions',
        'Reach',
        'Link clicks',
        'Purchases',
        'Date start',
        'Date stop',
      ].join(','),
      'Meta Agosto,120001,250000,1200000,20000,12000,700,18,2026-08-01,2026-08-21',
    ].join('\n');
    const file = new File([csv], 'meta.csv', { type: 'text/csv' });
    const metaType = IMPORT_TYPES.find((type) => type.id === 'campaigns');

    expect(metaType).toBeTruthy();

    service.selectImportType(metaType!);
    service.setFile(file);
    await service.readFile();
    service.validateRows();
    service.setConfirmationAccepted(true);
    service.confirmImport();

    const campaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) ?? '[]') as readonly {
      readonly name: string;
      readonly amountSpent: number;
      readonly purchases: number;
    }[];

    expect(service.importResult()?.importedRows).toBe(1);
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0]).toMatchObject({
      name: 'Meta Agosto',
      amountSpent: 250000,
      purchases: 18,
    });
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

  it('should show the rejected status value in validation messages', () => {
    const validator = new ImportValidationService();
    const result = validator.validateRows(
      [
        { rowIndex: 1, values: ['ESTATUS'], empty: false },
        { rowIndex: 2, values: ['ESTADO INVENTADO'], empty: false },
      ],
      1,
      ['ESTATUS'],
      [
        {
          key: 'status',
          label: 'Estado',
          description: '',
          required: true,
          dataType: 'status',
          acceptedAliases: ['estatus'],
          example: '',
          unique: false,
          nullable: false,
          validatorIds: ['status'],
        },
      ],
      [
        {
          systemColumnKey: 'status',
          sourceColumnName: 'ESTATUS',
          confidence: 100,
          manuallySelected: false,
          status: 'mapped',
        },
      ],
    );

    expect(result.issues[0]?.message).toBe('Estado no permitido: ESTADO INVENTADO.');
  });

  it('should accept Dropi logistics status values', () => {
    const validator = new ImportValidationService();
    const statuses = [
      'GUIA_GENERADA',
      'RECOGIDO POR DROPI',
      'PREPARADO PARA TRANSPORTADORA',
      'EN REPARTO',
      'EN PROCESAMIENTO',
      'EN BODEGA TRANSPORTADORA',
    ];
    const result = validator.validateRows(
      [
        { rowIndex: 1, values: ['ESTATUS'], empty: false },
        ...statuses.map((status, index) => ({
          rowIndex: index + 2,
          values: [status],
          empty: false,
        })),
      ],
      1,
      ['ESTATUS'],
      [
        {
          key: 'status',
          label: 'Estado',
          description: '',
          required: true,
          dataType: 'status',
          acceptedAliases: ['estatus'],
          example: '',
          unique: false,
          nullable: false,
          validatorIds: ['status'],
        },
      ],
      [
        {
          systemColumnKey: 'status',
          sourceColumnName: 'ESTATUS',
          confidence: 100,
          manuallySelected: false,
          status: 'mapped',
        },
      ],
    );

    expect(result.issues).toEqual([]);
    expect(result.validRows).toBe(statuses.length);
  });

  it('should generate templates', () => {
    const generator = new TemplateGeneratorService();
    const template = generator.templates[0];

    expect(generator.createCsvTemplate(template)).toContain(template.requiredColumns[0]);
  });
});
