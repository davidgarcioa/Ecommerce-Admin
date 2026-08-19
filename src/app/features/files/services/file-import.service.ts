import { computed, inject, Injectable, signal } from '@angular/core';

import { Carrier, DailyOrder, OrderStatus } from '../../daily-report/models/daily-order.model';
import { ImportedOrdersStoreService } from '../../daily-report/services/imported-orders-store.service';
import { IMPORT_STEPS, IMPORT_TYPES, ORDER_COLUMN_DEFINITIONS } from '../constants/files.constants';
import { ColumnMapping } from '../models/column-mapping.model';
import { ImportedFile } from '../models/imported-file.model';
import { ImportHistoryRecord } from '../models/import-history-record.model';
import { ImportResult, ImportStepId } from '../models/import-process.model';
import { ImportType } from '../models/import-type.model';
import { ImportValidationResult } from '../models/import-validation-result.model';
import { RowValidationResult, ValidationIssue } from '../models/row-validation.model';
import {
  HeaderDetectionResult,
  SpreadsheetSheet,
  SpreadsheetWorkbook,
} from '../models/spreadsheet-sheet.model';
import { PreviewRow, SpreadsheetRow } from '../models/spreadsheet-row.model';
import { createImportedFile, validateImportFile } from '../utils/file.utils';
import { createValidationErrorsCsv, downloadTextFile } from '../utils/import-export.utils';
import { normalizeColumnKey, normalizeText } from '../utils/validation.utils';
import { ColumnMappingService } from './column-mapping.service';
import { ImportHistoryService } from './import-history.service';
import { ImportValidationService } from './import-validation.service';
import { SpreadsheetReaderService } from './spreadsheet-reader.service';
import { TemplateGeneratorService } from './template-generator.service';

export type FilesTab = 'new-import' | 'history';

interface ImportDetectionState {
  readonly typeName: string;
  readonly confidence: number;
  readonly mappedColumns: number;
  readonly requiredColumns: number;
  readonly status: 'ready' | 'review';
}

@Injectable({ providedIn: 'root' })
export class FileImportService {
  private readonly spreadsheetReader = inject(SpreadsheetReaderService);
  private readonly mappingService = inject(ColumnMappingService);
  private readonly validationService = inject(ImportValidationService);
  private readonly historyService = inject(ImportHistoryService);
  private readonly templateGenerator = inject(TemplateGeneratorService);
  private readonly importedOrdersStore = inject(ImportedOrdersStoreService);

  private readonly activeTabState = signal<FilesTab>('new-import');
  private readonly currentStepState = signal<ImportStepId>('file');
  private readonly selectedImportTypeState = signal<ImportType | null>(IMPORT_TYPES[0]);
  private readonly importedFileState = signal<ImportedFile | null>(null);
  private readonly workbookState = signal<SpreadsheetWorkbook | null>(null);
  private readonly selectedSheetState = signal<SpreadsheetSheet | null>(null);
  private readonly previewRowsState = signal<readonly PreviewRow[]>([]);
  private readonly headerDetectionState = signal<HeaderDetectionResult | null>(null);
  private readonly columnMappingsState = signal<readonly ColumnMapping[]>([]);
  private readonly validationResultState = signal<ImportValidationResult | null>(null);
  private readonly importResultState = signal<ImportResult | null>(null);
  private readonly selectedHistoryRecordState = signal<ImportHistoryRecord | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly templatePanelVisibleState = signal(false);
  private readonly importDetailVisibleState = signal(false);
  private readonly confirmationAcceptedState = signal(false);
  private readonly progressState = signal({
    active: false,
    progress: 0,
    stage: 'Sin proceso activo',
    processedRows: 0,
    elapsedMs: 0,
    cancellable: false,
  });

  readonly activeTab = this.activeTabState.asReadonly();
  readonly currentStep = this.currentStepState.asReadonly();
  readonly steps = signal(IMPORT_STEPS).asReadonly();
  readonly selectedImportType = this.selectedImportTypeState.asReadonly();
  readonly importedFile = this.importedFileState.asReadonly();
  readonly workbook = this.workbookState.asReadonly();
  readonly sheets = computed(() => this.workbookState()?.sheets ?? []);
  readonly selectedSheet = this.selectedSheetState.asReadonly();
  readonly previewRows = this.previewRowsState.asReadonly();
  readonly headerDetection = this.headerDetectionState.asReadonly();
  readonly columnMappings = this.columnMappingsState.asReadonly();
  readonly validationResult = this.validationResultState.asReadonly();
  readonly validRows = computed(
    () => this.validationResultState()?.rows.filter((row) => row.valid && !row.excluded) ?? [],
  );
  readonly invalidRows = computed(
    () => this.validationResultState()?.rows.filter((row) => !row.valid && !row.excluded) ?? [],
  );
  readonly excludedRows = computed(
    () => this.validationResultState()?.rows.filter((row) => row.excluded) ?? [],
  );
  readonly importProgress = this.progressState.asReadonly();
  readonly importResult = this.importResultState.asReadonly();
  readonly importHistory = this.historyService.history;
  readonly selectedHistoryRecord = this.selectedHistoryRecordState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly templatePanelVisible = this.templatePanelVisibleState.asReadonly();
  readonly importDetailVisible = this.importDetailVisibleState.asReadonly();
  readonly confirmationAccepted = this.confirmationAcceptedState.asReadonly();
  readonly templates = signal(this.templateGenerator.templates).asReadonly();
  readonly importDetection = computed<ImportDetectionState | null>(() => {
    const type = this.selectedImportTypeState();
    const mappings = this.columnMappingsState();
    if (!type || mappings.length === 0) {
      return null;
    }

    const requiredKeys = new Set(
      ORDER_COLUMN_DEFINITIONS.filter((definition) => definition.required).map(
        (definition) => definition.key,
      ),
    );
    const mappedColumns = mappings.filter((mapping) => Boolean(mapping.sourceColumnName)).length;
    const mappedRequiredColumns = mappings.filter(
      (mapping) => requiredKeys.has(mapping.systemColumnKey) && Boolean(mapping.sourceColumnName),
    ).length;
    const requiredColumns = requiredKeys.size;
    const confidence = Math.round((mappedRequiredColumns / requiredColumns) * 100);

    return {
      typeName: type.name,
      confidence,
      mappedColumns,
      requiredColumns,
      status: confidence >= 85 ? 'ready' : 'review',
    };
  });

  startNewImport(): void {
    this.activeTabState.set('new-import');
    this.importedOrdersStore.clearOrders();
    this.resetImport();
  }

  selectImportType(type: ImportType): void {
    this.selectedImportTypeState.set(type);
    this.currentStepState.set('file');
  }

  setFile(file: File): void {
    const validationMessage = validateImportFile(
      file,
      this.selectedImportTypeState()?.maximumFileSize,
    );
    this.importedOrdersStore.clearOrders();
    this.importedFileState.set(createImportedFile(file, validationMessage));
    this.errorState.set(validationMessage);
    if (!validationMessage) {
      this.currentStepState.set('file');
    }
  }

  removeFile(): void {
    this.importedFileState.set(null);
    this.spreadsheetReader.reset();
    this.workbookState.set(null);
    this.selectedSheetState.set(null);
    this.previewRowsState.set([]);
    this.currentStepState.set('file');
  }

  async readFile(): Promise<void> {
    const importedFile = this.importedFileState();
    const type = this.selectedImportTypeState();
    if (!importedFile || !type || importedFile.status === 'invalid') {
      return;
    }
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      const workbook = await this.spreadsheetReader.readWorkbook(importedFile.file);
      this.workbookState.set(workbook);
      const firstAvailableSheet = workbook.sheets.find((sheet) => !sheet.empty) ?? null;
      if (firstAvailableSheet) {
        this.selectSheet(firstAvailableSheet.name);
      }
    } catch {
      this.errorState.set('No fue posible leer el archivo. Verifica que no esté corrupto.');
    } finally {
      this.loadingState.set(false);
    }
  }

  selectSheet(sheetName: string): void {
    const sheet = this.spreadsheetReader.selectSheet(sheetName);
    if (!sheet || sheet.empty) {
      return;
    }
    const aliases = ORDER_COLUMN_DEFINITIONS.flatMap((column) => [
      column.label,
      ...column.acceptedAliases,
    ]);
    const headerDetection = this.spreadsheetReader.detectHeaders(sheet.rows, aliases);
    this.selectedSheetState.set(sheet);
    this.headerDetectionState.set(headerDetection);
    this.previewRowsState.set(this.toPreviewRows(sheet.rows.slice(0, 50)));
    this.detectImportType(headerDetection.detectedHeaders);
    this.generateColumnMappings();
    if (this.hasEnoughMappedRequiredColumns()) {
      this.validateRows();
      return;
    }
    this.currentStepState.set('mapping');
  }

  setHeaderRow(index: number): void {
    const sheet = this.selectedSheetState();
    if (!sheet) {
      return;
    }
    const row = sheet.rows.find((item) => item.rowIndex === index);
    if (!row) {
      return;
    }
    this.headerDetectionState.set({
      headerRowIndex: index,
      confidenceScore: 100,
      detectedHeaders: row.values.map((value) => String(value ?? '')),
      duplicateHeaders: [],
      emptyHeaders: [],
    });
    this.generateColumnMappings();
  }

  generateColumnMappings(): void {
    const headers = this.headerDetectionState()?.detectedHeaders ?? [];
    this.columnMappingsState.set(
      this.mappingService.generateMappings(ORDER_COLUMN_DEFINITIONS, headers),
    );
    this.currentStepState.set('mapping');
  }

  reviewMapping(): void {
    this.currentStepState.set('mapping');
  }

  updateColumnMapping(mapping: ColumnMapping): void {
    this.columnMappingsState.set(
      this.mappingService.updateMapping(this.columnMappingsState(), mapping),
    );
  }

  validateRows(): void {
    const sheet = this.selectedSheetState();
    const header = this.headerDetectionState();
    if (!sheet || !header) {
      return;
    }
    this.loadingState.set(true);
    const result = this.validationService.validateRows(
      sheet.rows,
      header.headerRowIndex,
      header.detectedHeaders,
      ORDER_COLUMN_DEFINITIONS,
      this.columnMappingsState(),
    );
    this.validationResultState.set(result);
    this.loadingState.set(false);
    this.currentStepState.set('validation');
  }

  applyAutoFix(issueId: string): void {
    this.patchIssue(issueId, (issue) => this.validationService.applyAutoFix(issue));
  }

  applyAllSafeFixes(): void {
    const result = this.validationResultState();
    if (!result) {
      return;
    }
    result.issues
      .filter((issue) => issue.autoFixAvailable)
      .forEach((issue) => this.applyAutoFix(issue.id));
  }

  excludeRow(index: number): void {
    this.patchRows(index, true);
  }

  restoreRow(index: number): void {
    this.patchRows(index, false);
  }

  confirmImport(): void {
    const validation = this.validationResultState();
    const type = this.selectedImportTypeState();
    const file = this.importedFileState();
    const sheet = this.selectedSheetState();
    if (!validation || !type || !file || !sheet || !this.confirmationAcceptedState()) {
      return;
    }
    if (validation.errorRows > validation.excludedRows) {
      this.errorState.set('Existen errores bloqueantes sin excluir.');
      return;
    }
    this.progressState.set({
      active: false,
      progress: 100,
      stage: 'Completado',
      processedRows: validation.validRows,
      elapsedMs: 1200,
      cancellable: false,
    });
    const result: ImportResult = {
      id: `IMP-${Date.now()}`,
      status: validation.warningRows > 0 || validation.excludedRows > 0 ? 'partial' : 'completed',
      importedRows: validation.validRows,
      omittedRows: validation.excludedRows,
      warnings: validation.warningRows,
      durationMs: 1200,
      createdAt: new Date().toISOString(),
      message: 'Importación completada y registrada en el historial.',
    };
    this.importResultState.set(result);
    if (type.id === 'orders') {
      this.importedOrdersStore.replaceOrders(this.toDailyOrders(this.validRows()));
    }
    this.historyService.addRecord({
      id: result.id,
      createdAt: result.createdAt,
      typeId: type.id,
      typeName: type.name,
      fileName: file.name,
      fileSize: file.formattedSize,
      sheetName: sheet.name,
      processedRows: validation.totalRows,
      successfulRows: validation.validRows,
      omittedRows: validation.excludedRows,
      errorCount: validation.errorRows,
      warningCount: validation.warningRows,
      status: result.status === 'completed' ? 'Completada' : 'Parcial',
      durationMs: result.durationMs,
      source: 'Firestore',
      mappedColumns: this.columnMappingsState().filter((mapping) => mapping.sourceColumnName)
        .length,
    });
    this.currentStepState.set('result');
  }

  private toDailyOrders(rows: readonly RowValidationResult[]): readonly DailyOrder[] {
    const importedAt = new Date().toISOString();

    return rows.map((row) => this.toDailyOrder(row, importedAt));
  }

  private toDailyOrder(row: RowValidationResult, importedAt: string): DailyOrder {
    const normalizedRow = row.normalizedRow;
    const orderNumber = this.readText(normalizedRow, 'orderNumber') || `DROP-${row.rowIndex}`;
    const orderDate = this.readText(normalizedRow, 'date') || importedAt.slice(0, 10);
    const orderHour = this.readText(normalizedRow, 'orderHour');
    const createdAt = this.toDateTime(orderDate, orderHour, importedAt);
    const productName = this.readText(normalizedRow, 'product') || 'Producto sin nombre';
    const orderValue = this.readNumber(normalizedRow, 'value');
    const shippingCost = this.readNumber(normalizedRow, 'shippingCost');
    const returnShippingCost = this.readNumber(normalizedRow, 'returnShippingCost');
    const commission = this.readNumber(normalizedRow, 'commission');
    const providerCost = this.readNumber(normalizedRow, 'providerCost');
    const providerCostTotal = this.readNumber(normalizedRow, 'providerCostTotal');
    const estimatedProfit =
      this.readNumber(normalizedRow, 'estimatedProfit') ||
      Math.max(0, orderValue - providerCostTotal - shippingCost - returnShippingCost - commission);
    const rawStatus = this.readText(normalizedRow, 'status');
    const novelty = this.readText(normalizedRow, 'novelty');
    const noveltySolved = this.readBoolean(normalizedRow, 'noveltySolved');
    const lastMovementAt = this.toDateTime(
      this.readText(normalizedRow, 'lastMovementDate'),
      this.readText(normalizedRow, 'lastMovementHour'),
      '',
    );
    const noveltyAt = this.toDateTime(
      this.readText(normalizedRow, 'noveltyDate'),
      this.readText(normalizedRow, 'noveltyHour'),
      '',
    );
    const solvedAt = this.toDateTime(
      this.readText(normalizedRow, 'solvedDate'),
      this.readText(normalizedRow, 'solvedHour'),
      '',
    );

    return {
      id: `dropi-${orderNumber}`,
      orderNumber,
      createdAt,
      reportDate: this.readText(normalizedRow, 'reportDate'),
      orderHour,
      customerName: this.readText(normalizedRow, 'customer') || 'Cliente sin nombre',
      customerPhone: this.readText(normalizedRow, 'phone'),
      customerEmail: this.readText(normalizedRow, 'email'),
      customerDocumentType: this.readText(normalizedRow, 'customerDocumentType'),
      customerDocumentNumber: this.readText(normalizedRow, 'customerDocumentNumber'),
      productName,
      productGroupId: this.toProductGroupId(productName),
      productGroupName: this.toProductGroupName(productName),
      guideNumber: this.readText(normalizedRow, 'guideNumber'),
      guideStatus: this.toGuideStatus(rawStatus),
      shippingType: this.toTitleCase(this.readText(normalizedRow, 'shippingType')),
      department: this.toTitleCase(this.readText(normalizedRow, 'department')),
      city: this.toTitleCase(this.readText(normalizedRow, 'city')),
      address: this.readText(normalizedRow, 'address'),
      notes: this.readText(normalizedRow, 'notes'),
      carrier: this.toCarrier(this.readText(normalizedRow, 'carrier')),
      status: this.toOrderStatus(rawStatus),
      orderValue,
      advertisingCost: 0,
      estimatedProfit,
      shippingCost,
      returnShippingCost,
      commission,
      commissionPercentage: this.readNumber(normalizedRow, 'commissionPercentage'),
      providerCost,
      providerCostTotal,
      productId: this.readText(normalizedRow, 'productId'),
      sku: this.readText(normalizedRow, 'sku'),
      variationId: this.readText(normalizedRow, 'variationId'),
      variation: this.readText(normalizedRow, 'variation'),
      quantity: this.readNumber(normalizedRow, 'quantity'),
      novelty,
      noveltySolved,
      noveltyAt,
      solution: this.readText(normalizedRow, 'solution'),
      solvedAt,
      observation: this.readText(normalizedRow, 'observation'),
      lastMovementAt,
      lastMovement: this.readText(normalizedRow, 'lastMovement'),
      lastMovementConcept: this.readText(normalizedRow, 'lastMovementConcept'),
      lastMovementLocation: this.toTitleCase(this.readText(normalizedRow, 'lastMovementLocation')),
      seller: this.readText(normalizedRow, 'seller'),
      storeType: this.readText(normalizedRow, 'storeType'),
      storeName: this.readText(normalizedRow, 'storeName'),
      storeOrderId: this.readText(normalizedRow, 'storeOrderId'),
      storeOrderNumber: this.readText(normalizedRow, 'storeOrderNumber'),
      tags: this.readText(normalizedRow, 'tags'),
      guideGeneratedAt: this.readText(normalizedRow, 'guideGeneratedAt'),
      indemnizationCount: this.readNumber(normalizedRow, 'indemnizationCount'),
      lastIndemnizationConcept: this.readText(normalizedRow, 'lastIndemnizationConcept'),
      operationDays: this.calculateOperationDays(createdAt),
      urgent: this.isUrgentOrder(rawStatus, novelty, noveltySolved),
      paymentMethod: this.toPaymentMethod(this.readText(normalizedRow, 'shippingType')),
      lastUpdated: lastMovementAt || importedAt,
    };
  }

  private readText(
    row: Readonly<Record<string, string | number | boolean | null>>,
    key: string,
  ): string {
    const value = row[key];
    return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  }

  private readNumber(
    row: Readonly<Record<string, string | number | boolean | null>>,
    key: string,
  ): number {
    const value = row[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private readBoolean(
    row: Readonly<Record<string, string | number | boolean | null>>,
    key: string,
  ): boolean {
    return row[key] === true;
  }

  private toCarrier(value: string): Carrier {
    const normalizedValue = normalizeText(value);
    if (normalizedValue.includes('servientrega')) {
      return 'Servientrega';
    }
    if (normalizedValue.includes('inter')) {
      return 'Inter Rapidísimo';
    }
    if (normalizedValue.includes('coordinadora')) {
      return 'Coordinadora';
    }
    if (normalizedValue.includes('tcc')) {
      return 'TCC';
    }

    return 'Envía';
  }

  private toOrderStatus(value: string): OrderStatus {
    const normalizedValue = normalizeText(value);
    const statusByDropiValue: readonly [readonly string[], OrderStatus][] = [
      [['entregado'], 'Entregada'],
      [['cancelado'], 'Cancelada'],
      [['devolucion', 'rechazado', 'reclame en oficina'], 'Devuelta'],
      [['transito nacional', 'intento de entrega'], 'En tránsito'],
      [['despachado', 'en bodega', 'en bodega origen'], 'Despachada'],
      [['pendiente confirmacion', 'pendiente'], 'Pendiente'],
      [['novedad'], 'Pendiente'],
    ];
    const match = statusByDropiValue.find(([aliases]) =>
      aliases.some((alias) => normalizedValue.includes(alias)),
    );

    return match?.[1] ?? 'Pendiente';
  }

  private toGuideStatus(value: string): string {
    const normalizedValue = normalizeText(value);

    if (!normalizedValue) {
      return 'Sin estado';
    }

    const guideStatusByDropiValue: readonly [readonly string[], string][] = [
      [['pendiente confirmacion'], 'Pendiente confirmación'],
      [['transito nacional', 'en ruta', 'intento de entrega'], 'En ruta'],
      [['en bodega origen', 'en bodega'], 'En bodega'],
      [['entregado'], 'Entregada'],
      [['novedad'], 'Novedad'],
      [['devolucion', 'reclame en oficina', 'rechazado'], 'Devuelta'],
      [['cancelado'], 'Cancelada'],
      [['despachado'], 'Despachada'],
    ];
    const match = guideStatusByDropiValue.find(([aliases]) =>
      aliases.some((alias) => normalizedValue.includes(alias)),
    );

    return match?.[1] ?? this.toTitleCase(value);
  }

  private toPaymentMethod(shippingType: string): DailyOrder['paymentMethod'] {
    const normalizedValue = normalizeText(shippingType);

    return normalizedValue.includes('recaudo') ? 'Contraentrega' : 'Transferencia';
  }

  private toProductGroupName(productName: string): string {
    const cleanName = this.toTitleCase(productName);
    const firstWords = cleanName.split(' ').filter(Boolean).slice(0, 3).join(' ');

    return firstWords || 'Sin conjunto';
  }

  private toProductGroupId(productName: string): string {
    return normalizeColumnKey(this.toProductGroupName(productName)) || 'sin-conjunto';
  }

  private toTitleCase(value: string): string {
    if (!value.trim()) {
      return '';
    }

    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(' ');
  }

  private calculateOperationDays(createdAt: string): number {
    const createdDate = new Date(createdAt);
    if (Number.isNaN(createdDate.getTime())) {
      return 0;
    }

    return Math.max(0, Math.ceil((Date.now() - createdDate.getTime()) / 86_400_000));
  }

  private toDateTime(date: string, hour: string, fallback: string): string {
    if (!date) {
      return fallback;
    }

    const cleanHour = hour.match(/^\d{1,2}:\d{2}/)?.[0] ?? '00:00';
    const parsedDate = new Date(`${date}T${cleanHour}:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toISOString();
  }

  private isUrgentOrder(status: string, novelty: string, noveltySolved: boolean): boolean {
    const normalizedStatus = normalizeText(status);
    const hasOpenNovelty = novelty.trim().length > 0 && !noveltySolved;

    return (
      hasOpenNovelty ||
      normalizedStatus.includes('novedad') ||
      normalizedStatus.includes('reclame en oficina')
    );
  }

  cancelImport(): void {
    this.progressState.update((progress) => ({ ...progress, active: false, stage: 'Cancelado' }));
  }

  retryImport(): void {
    this.currentStepState.set('mapping');
  }

  goToStep(step: ImportStepId): void {
    this.currentStepState.set(step);
  }

  goToConfirmation(): void {
    this.currentStepState.set('confirmation');
  }

  resetImport(): void {
    this.importedFileState.set(null);
    this.workbookState.set(null);
    this.selectedSheetState.set(null);
    this.previewRowsState.set([]);
    this.headerDetectionState.set(null);
    this.columnMappingsState.set([]);
    this.validationResultState.set(null);
    this.importResultState.set(null);
    this.confirmationAcceptedState.set(false);
    this.errorState.set(null);
    this.currentStepState.set('file');
    this.spreadsheetReader.reset();
  }

  openHistory(): void {
    this.activeTabState.set('history');
  }

  openImportDetail(record: ImportHistoryRecord): void {
    this.selectedHistoryRecordState.set(record);
    this.importDetailVisibleState.set(true);
  }

  closeImportDetail(): void {
    this.importDetailVisibleState.set(false);
    this.selectedHistoryRecordState.set(null);
  }

  deleteHistoryRecord(id: string): void {
    this.historyService.deleteRecord(id);
  }

  openTemplatePanel(): void {
    this.templatePanelVisibleState.set(true);
  }

  closeTemplatePanel(): void {
    this.templatePanelVisibleState.set(false);
  }

  downloadTemplate(templateId: string): void {
    const template = this.templateGenerator.getTemplate(templateId);
    if (!template) {
      return;
    }
    downloadTextFile(
      `${template.id}.csv`,
      this.templateGenerator.createCsvTemplate(template),
      'text/csv',
    );
  }

  exportValidationErrors(): void {
    const issues = this.validationResultState()?.issues ?? [];
    downloadTextFile(
      `errores-importacion-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.csv`,
      createValidationErrorsCsv(issues),
      'text/csv',
    );
  }

  exportImportSummary(): void {
    downloadTextFile(
      'resumen-importacion.json',
      JSON.stringify(this.importResultState(), null, 2),
      'application/json',
    );
  }

  setConfirmationAccepted(accepted: boolean): void {
    this.confirmationAcceptedState.set(accepted);
  }

  private toPreviewRows(rows: readonly SpreadsheetRow[]): readonly PreviewRow[] {
    return rows.map((row) => ({
      id: `row-${row.rowIndex}`,
      rowIndex: row.rowIndex,
      cells: row.values.map((value) => String(value ?? '')).join(' | '),
    }));
  }

  private patchRows(rowIndex: number, excluded: boolean): void {
    const result = this.validationResultState();
    if (!result) {
      return;
    }
    const rows = result.rows.map((row) => (row.rowIndex === rowIndex ? { ...row, excluded } : row));
    const issues = result.issues.map((issue) =>
      issue.rowIndex === rowIndex ? { ...issue, excluded } : issue,
    );
    this.validationResultState.set({
      ...result,
      rows,
      issues,
      excludedRows: rows.filter((row) => row.excluded).length,
    });
  }

  private patchIssue(
    issueId: string,
    transform: (issue: ValidationIssue) => ValidationIssue,
  ): void {
    const result = this.validationResultState();
    if (!result) {
      return;
    }
    const issues = result.issues.map((issue) => (issue.id === issueId ? transform(issue) : issue));
    this.validationResultState.set({
      ...result,
      issues,
      fixableIssues: issues.filter((issue) => issue.autoFixAvailable).length,
    });
  }

  private hasEnoughMappedRequiredColumns(): boolean {
    const requiredKeys = new Set(
      ORDER_COLUMN_DEFINITIONS.filter((definition) => definition.required).map(
        (definition) => definition.key,
      ),
    );
    const mappedRequiredColumns = this.columnMappingsState().filter(
      (mapping) => requiredKeys.has(mapping.systemColumnKey) && Boolean(mapping.sourceColumnName),
    ).length;

    return mappedRequiredColumns === requiredKeys.size;
  }

  private detectImportType(headers: readonly string[]): void {
    const normalizedHeaders = headers.map(normalizeColumnKey);
    const headerText = headers.map(normalizeText).join(' ');
    const scoredTypes = IMPORT_TYPES.map((type) => ({
      type,
      score: this.scoreImportType(type.id, normalizedHeaders, headerText),
    })).sort((first, second) => second.score - first.score);
    const bestMatch = scoredTypes[0];

    if (bestMatch && bestMatch.score > 0) {
      this.selectedImportTypeState.set(bestMatch.type);
    }
  }

  private scoreImportType(
    typeId: ImportType['id'],
    normalizedHeaders: readonly string[],
    headerText: string,
  ): number {
    const includesHeader = (values: readonly string[]): number =>
      values.filter((value) => normalizedHeaders.some((header) => header.includes(value))).length;

    switch (typeId) {
      case 'orders':
        return includesHeader([
          'pedido',
          'orden',
          'producto',
          'cliente',
          'ciudad',
          'valor',
          'total',
        ]);
      case 'deliveries':
        return (
          includesHeader(['guia', 'transportadora', 'envio', 'despacho', 'novedad']) +
          (headerText.includes('transportadora') ? 2 : 0)
        );
      case 'returns':
        return includesHeader(['devolucion', 'rechazo', 'devuelta']);
      case 'expenses':
        return includesHeader(['gasto', 'costo', 'categoria', 'soporte']);
      case 'campaigns':
        return includesHeader(['campana', 'pauta', 'roas', 'cpa', 'meta']);
      case 'products':
        return includesHeader(['producto', 'sku', 'inventario']) - includesHeader(['pedido']);
      case 'product-groups':
        return includesHeader(['conjunto', 'grupo', 'coleccion']);
      case 'inventory':
        return includesHeader(['stock', 'existencia', 'inventario']);
      case 'collections':
        return includesHeader(['recaudo', 'pago', 'cobro']);
    }
  }
}
