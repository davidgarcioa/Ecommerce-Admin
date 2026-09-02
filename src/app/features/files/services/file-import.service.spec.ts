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

  async function importBasicOrdersFile(
    fileName: string,
    orderNumber: string,
    value = 100000,
  ): Promise<void> {
    const file = new File(
      [
        `Orden,Fecha,Cliente,Producto,Ciudad,Estado,Valor\n${orderNumber},2026-07-29,Ana,Producto,Bogota,Entregada,${value}`,
      ],
      fileName,
      { type: 'text/csv' },
    );

    service.setFile(file);
    await service.readFile();
    service.validateRows();
    service.setConfirmationAccepted(true);
    service.confirmImport();
  }

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
    expect(service.validationResult()).toMatchObject({ errorRows: 0 });
    service.setConfirmationAccepted(true);
    service.confirmImport();

    expect(service.importResult()?.importedRows).toBe(1);
    expect(service.importHistory().length).toBe(initialHistory + 1);
  });

  it('should keep multiple import history records', async () => {
    await importBasicOrdersFile('ordenes-uno.csv', 'ORD-1');
    service.startNewImport();
    await importBasicOrdersFile('ordenes-dos.csv', 'ORD-2', 200000);

    expect(service.importHistory()).toHaveLength(2);
    expect(service.importHistory().map((record) => record.fileName)).toEqual(
      expect.arrayContaining(['ordenes-uno.csv', 'ordenes-dos.csv']),
    );
  });

  it('should replace previous order data on every order import', async () => {
    await importBasicOrdersFile('ordenes-viejas.csv', 'ORD-OLD');
    service.startNewImport();
    await importBasicOrdersFile('ordenes-nuevas.csv', 'ORD-NEW', 250000);

    const orders = JSON.parse(
      localStorage.getItem('ecommerce-control-center.imported-orders') ?? '[]',
    ) as readonly {
      readonly orderNumber: string;
      readonly orderValue: number;
    }[];

    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ orderNumber: 'ORD-NEW', orderValue: 250000 });
  });

  it('should reject the exact same imported file', async () => {
    const content =
      'Orden,Fecha,Cliente,Producto,Ciudad,Estado,Valor\nORD-1,2026-07-29,Ana,Producto,Bogota,Entregada,100000';
    const file = new File([content], 'ordenes-original.csv', { type: 'text/csv' });
    const duplicate = new File([content], 'ordenes-copia.csv', { type: 'text/csv' });

    service.setFile(file);
    await service.readFile();
    service.validateRows();
    service.setConfirmationAccepted(true);
    service.confirmImport();

    service.startNewImport();
    service.setFile(duplicate);
    await service.readFile();

    expect(service.error()).toBe(
      'Este archivo ya fue importado. No puedes subir el mismo archivo otra vez.',
    );
    expect(service.importedFile()?.status).toBe('invalid');
    expect(service.workbook()).toBeNull();
    expect(service.importHistory()).toHaveLength(1);
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

  it('should import Clickcero Meta Ads export headers correctly', async () => {
    const csv = [
      [
        'Inicio del informe',
        'Fin del informe',
        'Nombre de la campaña',
        'Objetivo',
        'Entrega de la campaña',
        'Alcance',
        'Frecuencia',
        'Importe gastado (COP)',
        'Compras',
        'Costo por compra (COP)',
        'Impresiones',
        'Clics en el enlace',
      ].join(','),
      '2026-08-01,2026-09-02,Collar rosa 3d,Ventas,active,142141,1.44,934563,50,18691.26,204895,2135',
      '2026-08-01,2026-09-02,Campaña sin entrega,Interacción,inactive,0,0,0,0,,0,0',
    ].join('\n');
    const file = new File([csv], 'Clickcero-TECNOLOGIA-Y-ELECTRONICA-Campañas.csv', {
      type: 'text/csv',
    });

    service.setFile(file);
    await service.readFile();
    service.validateRows();
    service.setConfirmationAccepted(true);
    service.confirmImport();

    const campaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) ?? '[]') as readonly {
      readonly name: string;
      readonly status: string;
      readonly adAccountName: string;
      readonly amountSpent: number;
      readonly purchases: number;
      readonly clicks: number;
      readonly startDate: string;
      readonly endDate: string;
    }[];

    expect(service.selectedImportType()?.id).toBe('campaigns');
    expect(service.importResult()?.importedRows).toBe(2);
    expect(campaigns).toHaveLength(2);
    expect(campaigns[0]).toMatchObject({
      name: 'Collar rosa 3d',
      status: 'Activa',
      adAccountName: 'Clickcero Tecnologia Y Electronica',
      amountSpent: 934563,
      purchases: 50,
      clicks: 2135,
      startDate: '2026-08-01',
      endDate: '2026-09-02',
    });
    expect(campaigns[1]?.status).toBe('Pausada');
  });

  it('should replace previous campaign data on every campaign import', async () => {
    const metaType = IMPORT_TYPES.find((type) => type.id === 'campaigns');

    expect(metaType).toBeTruthy();

    service.selectImportType(metaType!);
    service.setFile(
      new File(
        ['Campaign name,Amount spent,Purchases\nCampana vieja,1000,1'],
        'campanas-viejas.csv',
        { type: 'text/csv' },
      ),
    );
    await service.readFile();
    service.validateRows();
    service.setConfirmationAccepted(true);
    service.confirmImport();

    service.startNewImport();
    service.selectImportType(metaType!);
    service.setFile(
      new File(
        ['Campaign name,Amount spent,Purchases\nCampana nueva,2000,2'],
        'campanas-nuevas.csv',
        { type: 'text/csv' },
      ),
    );
    await service.readFile();
    service.validateRows();
    service.setConfirmationAccepted(true);
    service.confirmImport();

    const campaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY) ?? '[]') as readonly {
      readonly name: string;
      readonly amountSpent: number;
    }[];

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0]).toMatchObject({ name: 'Campana nueva', amountSpent: 2000 });
    expect(service.importHistory()).toHaveLength(2);
  });

  it('should aggregate Dropi product rows by guide before saving orders', async () => {
    const csv = [
      [
        'ID',
        'FECHA',
        'NOMBRE CLIENTE',
        'PRODUCTO',
        'CIUDAD DESTINO',
        'ESTATUS',
        'TOTAL DE LA ORDEN',
        'NÚMERO GUIA',
        'PRECIO FLETE',
        'PRECIO PROVEEDOR X CANTIDAD',
        'CANTIDAD',
      ].join(','),
      '88099636,02-09-2026,Odilia Oviedo,Tarjeta Prediseñada,ESPINAL,GUIA_GENERADA,1500,024034839837,341.78,1500,1',
      '88099636,02-09-2026,Odilia Oviedo,Collar Rosa 3D,ESPINAL,GUIA_GENERADA,78400,024034839837,17863.72,14500,1',
    ].join('\n');
    const file = new File([csv], 'ordenes_productos.csv', { type: 'text/csv' });

    service.setFile(file);
    await service.readFile();
    service.validateRows();
    service.setConfirmationAccepted(true);
    service.confirmImport();

    const orders = JSON.parse(
      localStorage.getItem('ecommerce-control-center.imported-orders') ?? '[]',
    ) as readonly {
      readonly orderNumber: string;
      readonly guideNumber: string;
      readonly productName: string;
      readonly status: string;
      readonly guideStatus: string;
      readonly orderValue: number;
      readonly shippingCost: number;
      readonly providerCostTotal: number;
      readonly quantity: number;
    }[];

    expect(service.importResult()?.importedRows).toBe(2);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      orderNumber: '88099636',
      guideNumber: '024034839837',
      productName: 'Varios productos',
      status: 'Despachada',
      guideStatus: 'Guía generada',
      orderValue: 79900,
      shippingCost: 18205.5,
      providerCostTotal: 16000,
      quantity: 2,
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
      'ENTREGADO A TRANSPORTADORA',
      'EN BODEGA DROPI',
      'EN REPARTO',
      'EN PROCESAMIENTO',
      'EN BODEGA TRANSPORTADORA',
      'EN BODEGA DESTINO',
      'EN ESPERA DE RUTA DOMESTICA',
      'EN PUNTO DROOP',
      'TELEMERCADEO',
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
