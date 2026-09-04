import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { TableActionClick } from '../../../../shared/components/data-table/models/table-action.model';
import { ColumnMappingComponent } from '../../components/column-mapping/column-mapping';
import { DataPreviewTableComponent } from '../../components/data-preview-table/data-preview-table';
import { FileInformationCardComponent } from '../../components/file-information-card/file-information-card';
import { FileUploadDropzoneComponent } from '../../components/file-upload-dropzone/file-upload-dropzone';
import { FilesErrorStateComponent } from '../../components/files-error-state/files-error-state';
import { FilesHeaderComponent } from '../../components/files-header/files-header';
import { ImportConfirmationComponent } from '../../components/import-confirmation/import-confirmation';
import { ImportDetailDrawerComponent } from '../../components/import-detail-drawer/import-detail-drawer';
import { ImportHistoryTableComponent } from '../../components/import-history-table/import-history-table';
import { ImportProgressComponent } from '../../components/import-progress/import-progress';
import { ImportResultComponent } from '../../components/import-result/import-result';
import { ImportStepperComponent } from '../../components/import-stepper/import-stepper';
import { SheetSelectorComponent } from '../../components/sheet-selector/sheet-selector';
import { TemplateDownloadPanelComponent } from '../../components/template-download-panel/template-download-panel';
import { ValidationErrorsTableComponent } from '../../components/validation-errors-table/validation-errors-table';
import { ValidationSummaryComponent } from '../../components/validation-summary/validation-summary';
import { getImportColumnDefinitions } from '../../constants/files.constants';
import { ImportHistoryRecord } from '../../models/import-history-record.model';
import { ImportStepId } from '../../models/import-process.model';
import { ValidationIssue } from '../../models/row-validation.model';
import { FileImportService } from '../../services/file-import.service';

@Component({
  selector: 'app-files-page',
  imports: [
    FilesHeaderComponent,
    ImportStepperComponent,
    FileUploadDropzoneComponent,
    FileInformationCardComponent,
    SheetSelectorComponent,
    DataPreviewTableComponent,
    ColumnMappingComponent,
    ValidationSummaryComponent,
    ValidationErrorsTableComponent,
    ImportConfirmationComponent,
    ImportProgressComponent,
    ImportResultComponent,
    ImportHistoryTableComponent,
    ImportDetailDrawerComponent,
    TemplateDownloadPanelComponent,
    FilesErrorStateComponent,
  ],
  templateUrl: './files-page.html',
  styleUrl: './files-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesPageComponent {
  private readonly fileImportService = inject(FileImportService);

  readonly activeTab = this.fileImportService.activeTab;
  readonly currentStep = this.fileImportService.currentStep;
  readonly steps = this.fileImportService.steps;
  readonly selectedImportType = this.fileImportService.selectedImportType;
  readonly importedFile = this.fileImportService.importedFile;
  readonly sheets = this.fileImportService.sheets;
  readonly selectedSheet = this.fileImportService.selectedSheet;
  readonly previewRows = this.fileImportService.previewRows;
  readonly headerDetection = this.fileImportService.headerDetection;
  readonly columnMappings = this.fileImportService.columnMappings;
  readonly validationResult = this.fileImportService.validationResult;
  readonly importProgress = this.fileImportService.importProgress;
  readonly importResult = this.fileImportService.importResult;
  readonly importHistory = this.fileImportService.importHistory;
  readonly activeDataRecordIds = this.fileImportService.activeDataRecordIds;
  readonly selectedHistoryRecord = this.fileImportService.selectedHistoryRecord;
  readonly loading = this.fileImportService.loading;
  readonly error = this.fileImportService.error;
  readonly templatePanelVisible = this.fileImportService.templatePanelVisible;
  readonly importDetailVisible = this.fileImportService.importDetailVisible;
  readonly confirmationAccepted = this.fileImportService.confirmationAccepted;
  readonly templates = this.fileImportService.templates;
  readonly importDetection = this.fileImportService.importDetection;
  readonly detectedHeaders = computed(() => this.headerDetection()?.detectedHeaders ?? []);
  readonly columnDefinitions = computed(() =>
    getImportColumnDefinitions(this.selectedImportType()?.id),
  );

  onFileSelected(file: File): void {
    this.fileImportService.setFile(file);
    void this.fileImportService.readFile();
  }

  onHistoryAction(event: TableActionClick<ImportHistoryRecord>): void {
    if (event.action.id === 'delete-data') {
      this.fileImportService.deleteHistoryRecordWithData(event.row.id);
    } else if (event.action.id === 'delete') {
      this.fileImportService.deleteHistoryRecord(event.row.id);
    } else {
      this.fileImportService.openImportDetail(event.row);
    }
  }

  onValidationAction(event: TableActionClick<ValidationIssue>): void {
    if (event.action.id === 'fix') {
      this.fileImportService.applyAutoFix(event.row.id);
    }
    if (event.action.id === 'exclude') {
      this.fileImportService.excludeRow(event.row.rowIndex);
    }
    if (event.action.id === 'restore') {
      this.fileImportService.restoreRow(event.row.rowIndex);
    }
  }

  readonly startNewImport = (): void => this.fileImportService.startNewImport();
  readonly openHistory = (): void => this.fileImportService.openHistory();
  readonly openTemplates = (): void => this.fileImportService.openTemplatePanel();
  readonly closeTemplates = (): void => this.fileImportService.closeTemplatePanel();
  readonly removeFile = (): void => this.fileImportService.removeFile();
  readonly selectSheet = (sheetName: string): void => this.fileImportService.selectSheet(sheetName);
  readonly setHeaderRow = (index: number): void => this.fileImportService.setHeaderRow(index);
  readonly updateMapping = (
    mapping: Parameters<FileImportService['updateColumnMapping']>[0],
  ): void => this.fileImportService.updateColumnMapping(mapping);
  readonly validateRows = (): void => this.fileImportService.validateRows();
  readonly reviewMapping = (): void => this.fileImportService.reviewMapping();
  readonly applyFixes = (): void => this.fileImportService.applyAllSafeFixes();
  readonly exportErrors = (): void => this.fileImportService.exportValidationErrors();
  readonly goToConfirmation = (): void => this.fileImportService.goToConfirmation();
  readonly goToStep = (step: ImportStepId): void => this.fileImportService.goToStep(step);
  readonly setConfirmationAccepted = (accepted: boolean): void =>
    this.fileImportService.setConfirmationAccepted(accepted);
  readonly confirmImport = (): void => this.fileImportService.confirmImport();
  readonly cancelImport = (): void => this.fileImportService.cancelImport();
  readonly resetImport = (): void => this.fileImportService.resetImport();
  readonly exportSummary = (): void => this.fileImportService.exportImportSummary();
  readonly openImportDetail = (record: ImportHistoryRecord): void =>
    this.fileImportService.openImportDetail(record);
  readonly closeImportDetail = (): void => this.fileImportService.closeImportDetail();
  readonly deleteHistoryRecord = (id: string): void =>
    this.fileImportService.deleteHistoryRecord(id);
  readonly deleteHistoryRecordWithData = (id: string): void =>
    this.fileImportService.deleteHistoryRecordWithData(id);
  readonly retryImport = (): void => this.fileImportService.retryImport();
  readonly downloadTemplate = (id: string): void => this.fileImportService.downloadTemplate(id);
}
