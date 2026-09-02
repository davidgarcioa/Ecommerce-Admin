import { computed, inject, Injectable, signal } from '@angular/core';

import {
  AdvertisingPlatform,
  Campaign,
  CampaignObjective,
  CampaignStatus,
} from '../../campaigns/models/campaign.model';
import { ImportedCampaignsStoreService } from '../../campaigns/services/imported-campaigns-store.service';
import {
  calculateCpa,
  calculateCpc,
  calculateCpm,
  calculateCtr,
  calculateFrequency,
  calculateRoas,
} from '../../campaigns/utils/campaigns.utils';
import { Carrier, DailyOrder, OrderStatus } from '../../daily-report/models/daily-order.model';
import { ImportedOrdersStoreService } from '../../daily-report/services/imported-orders-store.service';
import { getImportColumnDefinitions, IMPORT_STEPS, IMPORT_TYPES } from '../constants/files.constants';
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
  private readonly importedCampaignsStore = inject(ImportedCampaignsStoreService);

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
      this.activeColumnDefinitions()
        .filter((definition) => definition.required)
        .map(
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
    const aliases = this.allKnownColumnAliases();
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
      this.mappingService.generateMappings(this.activeColumnDefinitions(), headers),
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
      this.activeColumnDefinitions(),
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
      this.importedOrdersStore.upsertOrders(this.toDailyOrders(this.validRows()));
    }
    if (type.id === 'campaigns') {
      this.importedCampaignsStore.upsertCampaigns(this.toCampaigns(this.validRows()));
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
      source: 'Archivo local',
      mappedColumns: this.columnMappingsState().filter((mapping) => mapping.sourceColumnName)
        .length,
    });
    this.currentStepState.set('result');
  }

  private toDailyOrders(rows: readonly RowValidationResult[]): readonly DailyOrder[] {
    const importedAt = new Date().toISOString();

    return this.aggregateDailyOrders(rows.map((row) => this.toDailyOrder(row, importedAt)));
  }

  private toCampaigns(rows: readonly RowValidationResult[]): readonly Campaign[] {
    const importedAt = new Date().toISOString();
    const fileName = this.importedFileState()?.name ?? '';

    return rows.map((row) => this.toCampaign(row, importedAt, fileName));
  }

  private toCampaign(row: RowValidationResult, importedAt: string, fileName: string): Campaign {
    const normalizedRow = row.normalizedRow;
    const campaignName = this.readText(normalizedRow, 'campaignName') || `Campaña fila ${row.rowIndex}`;
    const externalId = this.readText(normalizedRow, 'campaignId');
    const amountSpent = this.readNumber(normalizedRow, 'amountSpent');
    const attributedRevenue = this.readNumber(normalizedRow, 'attributedRevenue');
    const impressions = this.readNumber(normalizedRow, 'impressions');
    const reach = this.readNumber(normalizedRow, 'reach');
    const clicks = this.readNumber(normalizedRow, 'clicks');
    const purchases = this.readNumber(normalizedRow, 'purchases');
    const importedRoas = this.readNumber(normalizedRow, 'roas');
    const importedCpa = this.readNumber(normalizedRow, 'cpa');
    const startDate = this.readText(normalizedRow, 'startDate') || importedAt.slice(0, 10);
    const endDate = this.readText(normalizedRow, 'endDate');
    const accountName =
      this.readText(normalizedRow, 'accountName') ||
      this.inferAccountNameFromFile(fileName) ||
      'Meta Ads';
    const productGroupName =
      this.readText(normalizedRow, 'productGroupName') || this.inferProductGroupName(campaignName);

    return {
      id: `meta-${normalizeColumnKey(externalId || campaignName) || row.rowIndex}`,
      externalId: externalId || undefined,
      name: campaignName,
      objective: this.toCampaignObjective(this.readText(normalizedRow, 'objective')),
      status: this.toCampaignStatus(this.readText(normalizedRow, 'status')),
      adAccountId: normalizeColumnKey(accountName) || 'meta-ads',
      adAccountName: accountName,
      productGroupId: normalizeColumnKey(productGroupName) || 'sin-conjunto',
      productGroupName,
      platform: this.toAdvertisingPlatform(this.readText(normalizedRow, 'platform')),
      budgetType: 'Diario',
      dailyBudget: undefined,
      lifetimeBudget: undefined,
      amountSpent,
      attributedRevenue,
      impressions,
      reach,
      clicks,
      purchases,
      ctr: calculateCtr(clicks, impressions),
      cpc: calculateCpc(amountSpent, clicks),
      cpm: calculateCpm(amountSpent, impressions),
      cpa: importedCpa || calculateCpa(amountSpent, purchases),
      roas: importedRoas || calculateRoas(attributedRevenue, amountSpent),
      frequency: calculateFrequency(impressions, reach),
      startDate,
      endDate: endDate || undefined,
      createdAt: `${startDate}T00:00:00.000Z`,
      updatedAt: importedAt,
      lastSynchronizedAt: importedAt,
      hasWarnings: false,
    };
  }

  private toDailyOrder(row: RowValidationResult, importedAt: string): DailyOrder {
    const normalizedRow = row.normalizedRow;
    const orderNumber = this.readText(normalizedRow, 'orderNumber') || `DROP-${row.rowIndex}`;
    const orderDate = this.readText(normalizedRow, 'date') || importedAt.slice(0, 10);
    const reportDate = this.readText(normalizedRow, 'reportDate');
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
      reportDate,
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
      lastUpdated: lastMovementAt || this.toDateTime(reportDate, '', '') || createdAt || importedAt,
    };
  }

  private aggregateDailyOrders(orders: readonly DailyOrder[]): readonly DailyOrder[] {
    const byOrder = new Map<string, DailyOrder>();
    const lineKeysByOrder = new Map<string, Set<string>>();

    for (const order of orders) {
      const key = this.toOrderImportKey(order);
      const lineKey = this.toOrderLineKey(order);
      const knownLineKeys = lineKeysByOrder.get(key) ?? new Set<string>();

      if (knownLineKeys.has(lineKey)) {
        continue;
      }

      knownLineKeys.add(lineKey);
      lineKeysByOrder.set(key, knownLineKeys);

      const current = byOrder.get(key);
      byOrder.set(key, current ? this.mergeDailyOrderLines(current, order) : order);
    }

    return Array.from(byOrder.values()).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  private mergeDailyOrderLines(current: DailyOrder, incoming: DailyOrder): DailyOrder {
    const latest = this.shouldUseIncomingOrder(current, incoming) ? incoming : current;
    const productName = this.mergeProductLabel(current.productName, incoming.productName);
    const productGroupName =
      productName === 'Varios productos' ? 'Varios productos' : this.toProductGroupName(productName);

    return {
      ...latest,
      productName,
      productGroupName,
      productGroupId: normalizeColumnKey(productGroupName) || 'varios-productos',
      orderValue: current.orderValue + incoming.orderValue,
      advertisingCost: current.advertisingCost + incoming.advertisingCost,
      estimatedProfit: current.estimatedProfit + incoming.estimatedProfit,
      shippingCost: this.sumOptional(current.shippingCost, incoming.shippingCost),
      returnShippingCost: this.sumOptional(current.returnShippingCost, incoming.returnShippingCost),
      commission: this.sumOptional(current.commission, incoming.commission),
      providerCostTotal: this.sumOptional(current.providerCostTotal, incoming.providerCostTotal),
      quantity: this.sumOptional(current.quantity, incoming.quantity),
      productId: this.mergeSharedText(current.productId, incoming.productId),
      sku: this.mergeSharedText(current.sku, incoming.sku),
      variationId: this.mergeSharedText(current.variationId, incoming.variationId),
      variation: this.mergeSharedText(current.variation, incoming.variation),
      tags: this.mergeTags(current.tags, incoming.tags),
      urgent: current.urgent || incoming.urgent,
    };
  }

  private shouldUseIncomingOrder(current: DailyOrder, incoming: DailyOrder): boolean {
    return this.toSourceTime(incoming) >= this.toSourceTime(current);
  }

  private toSourceTime(order: DailyOrder): number {
    const value =
      order.lastMovementAt ||
      order.reportDate ||
      order.guideGeneratedAt ||
      order.createdAt ||
      order.lastUpdated;
    const parsed = Date.parse(value);

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private toOrderImportKey(order: DailyOrder): string {
    return normalizeColumnKey(order.guideNumber || order.orderNumber || order.id);
  }

  private toOrderLineKey(order: DailyOrder): string {
    return normalizeColumnKey(
      [
        order.productId,
        order.sku,
        order.variationId,
        order.variation,
        order.productName,
        order.orderValue,
        order.quantity,
      ].join('|'),
    );
  }

  private mergeProductLabel(current: string, incoming: string): string {
    if (!current.trim()) return incoming;
    if (!incoming.trim()) return current;
    if (normalizeText(current) === normalizeText(incoming)) return current;

    return 'Varios productos';
  }

  private mergeSharedText(current: string | undefined, incoming: string | undefined): string {
    const left = current?.trim() ?? '';
    const right = incoming?.trim() ?? '';

    if (!left) return right;
    if (!right) return left;
    return normalizeText(left) === normalizeText(right) ? left : '';
  }

  private mergeTags(current: string | undefined, incoming: string | undefined): string {
    const tags = [...`${current ?? ''},${incoming ?? ''}`.split(',')]
      .map((tag) => tag.trim())
      .filter(Boolean);
    const uniqueTags = Array.from(new Map(tags.map((tag) => [normalizeText(tag), tag])).values());

    return uniqueTags.join(', ');
  }

  private sumOptional(
    current: number | undefined,
    incoming: number | undefined,
  ): number | undefined {
    const total = (Number(current) || 0) + (Number(incoming) || 0);

    return total === 0 ? undefined : total;
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
      [['cancelado', 'cancelada'], 'Cancelada'],
      [['devolucion', 'rechazado', 'reclame en oficina'], 'Devuelta'],
      [
        [
          'transito nacional',
          'intento de entrega',
          'en reparto',
          'en bodega transportadora',
          'en bodega destino',
          'en espera de ruta domestica',
          'en punto droop',
        ],
        'En tránsito',
      ],
      [
        [
          'despachado',
          'despachada',
          'guia_generada',
          'guia generada',
          'recogido por dropi',
          'preparado para transportadora',
          'entregado a transportadora',
          'en procesamiento',
          'en bodega',
          'en bodega origen',
          'en bodega dropi',
        ],
        'Despachada',
      ],
      [['pendiente confirmacion', 'pendiente', 'telemercadeo'], 'Pendiente'],
      [['novedad'], 'Pendiente'],
    ];
    const match = statusByDropiValue.find(([aliases]) =>
      aliases.some((alias) => normalizedValue.includes(alias)),
    );

    return match?.[1] ?? 'Pendiente';
  }

  private toCampaignStatus(value: string): CampaignStatus {
    const normalizedValue = normalizeText(value);

    if (['inactive', 'inactivo', 'inactiva', 'not delivering'].includes(normalizedValue)) {
      return 'Pausada';
    }
    if (['active', 'activo', 'activa', 'delivering'].includes(normalizedValue)) return 'Activa';
    if (normalizedValue.includes('pause') || normalizedValue.includes('paus')) return 'Pausada';
    if (normalizedValue.includes('archive') || normalizedValue.includes('archiv')) return 'Archivada';
    if (normalizedValue.includes('error') || normalizedValue.includes('reject')) return 'Con errores';
    if (normalizedValue.includes('finish') || normalizedValue.includes('final')) return 'Finalizada';

    return 'Activa';
  }

  private toCampaignObjective(value: string): CampaignObjective {
    const normalizedValue = normalizeText(value);

    if (normalizedValue.includes('lead') || normalizedValue.includes('cliente')) {
      return 'Clientes potenciales';
    }
    if (normalizedValue.includes('recon') || normalizedValue.includes('awareness')) {
      return 'Reconocimiento';
    }
    if (normalizedValue.includes('traffic') || normalizedValue.includes('trafico')) {
      return 'TrÃ¡fico' as CampaignObjective;
    }
    if (normalizedValue.includes('engagement') || normalizedValue.includes('interaccion')) {
      return 'InteracciÃ³n' as CampaignObjective;
    }

    return 'Ventas';
  }

  private toAdvertisingPlatform(value: string): AdvertisingPlatform {
    const normalizedValue = normalizeText(value);

    if (normalizedValue.includes('instagram')) return 'Instagram';
    if (normalizedValue.includes('audience')) return 'Audience Network';
    if (normalizedValue.includes('messenger')) return 'Messenger';
    if (normalizedValue.includes('facebook')) return 'Facebook';

    return 'Varias plataformas';
  }

  private inferProductGroupName(campaignName: string): string {
    const cleanName = this.toTitleCase(campaignName);
    const [firstPart] = cleanName.split('|');

    return firstPart.trim() || 'Sin conjunto';
  }

  private inferAccountNameFromFile(fileName: string): string {
    const extensionless = fileName.replace(/\.[^.]+$/, '');
    const readableName = extensionless.replace(/[-_]+/g, ' ').trim();
    const markerIndex = normalizeText(readableName).search(/\bcampanas?\b/);

    if (markerIndex <= 0) {
      return '';
    }

    return this.toTitleCase(readableName.slice(0, markerIndex));
  }

  private toGuideStatus(value: string): string {
    const normalizedValue = normalizeText(value);

    if (!normalizedValue) {
      return 'Sin estado';
    }

    const guideStatusByDropiValue: readonly [readonly string[], string][] = [
      [['guia_generada', 'guia generada'], 'Guía generada'],
      [['recogido por dropi'], 'Recogida'],
      [['preparado para transportadora'], 'Preparado para transportadora'],
      [['entregado a transportadora'], 'Entregado a transportadora'],
      [['en procesamiento'], 'En procesamiento'],
      [['en reparto'], 'En reparto'],
      [['en bodega dropi'], 'En bodega Dropi'],
      [['en bodega destino'], 'En bodega destino'],
      [['en bodega transportadora'], 'En bodega'],
      [['en espera de ruta domestica'], 'En espera de ruta domestica'],
      [['en punto droop'], 'En punto Dropi'],
      [['telemercadeo'], 'Telemercadeo'],
      [['pendiente confirmacion'], 'Pendiente confirmación'],
      [['transito nacional', 'en ruta', 'intento de entrega'], 'En ruta'],
      [['en bodega origen', 'en bodega'], 'En bodega'],
      [['entregado'], 'Entregada'],
      [['novedad'], 'Novedad'],
      [['devolucion', 'reclame en oficina', 'rechazado'], 'Devuelta'],
      [['cancelado'], 'Cancelada'],
      [['despachado', 'despachada'], 'Despachada'],
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

  private activeColumnDefinitions() {
    return getImportColumnDefinitions(this.selectedImportTypeState()?.id);
  }

  private allKnownColumnAliases(): readonly string[] {
    const aliases = IMPORT_TYPES.flatMap((type) =>
      getImportColumnDefinitions(type.id).flatMap((column) => [
        column.label,
        ...column.acceptedAliases,
      ]),
    );

    return Array.from(new Set(aliases));
  }

  private hasEnoughMappedRequiredColumns(): boolean {
    const requiredKeys = new Set(
      this.activeColumnDefinitions()
        .filter((definition) => definition.required)
        .map(
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
        return includesHeader([
          'campana',
          'campaign',
          'campaignname',
          'amountspent',
          'importegastado',
          'impressions',
          'purchases',
          'roas',
          'cpa',
          'meta',
        ]);
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
