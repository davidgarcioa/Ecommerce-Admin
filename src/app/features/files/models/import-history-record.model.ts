import { ImportTypeId } from './import-type.model';

export type ImportHistoryStatus = 'Completada' | 'Parcial' | 'Fallida' | 'Cancelada';

export interface ImportHistoryRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly typeId: ImportTypeId;
  readonly typeName: string;
  readonly fileName: string;
  readonly fileSize: string;
  readonly fileChecksum?: string;
  readonly fileSizeBytes?: number;
  readonly sheetName: string;
  readonly processedRows: number;
  readonly successfulRows: number;
  readonly omittedRows: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly status: ImportHistoryStatus;
  readonly durationMs: number;
  readonly source: 'Archivo local';
  readonly mappedColumns: number;
}
