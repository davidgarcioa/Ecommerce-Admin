export type FileImportStatus =
  | 'pending'
  | 'reading'
  | 'ready'
  | 'validating'
  | 'valid'
  | 'invalid'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ImportedFile {
  readonly id: string;
  readonly file: File;
  readonly name: string;
  readonly extension: string;
  readonly mimeType: string;
  readonly size: number;
  readonly formattedSize: string;
  readonly lastModified: string;
  readonly importedAt: string;
  readonly status: FileImportStatus;
  readonly validationMessage?: string;
  readonly sheetCount: number;
  readonly selectedSheetName?: string;
  readonly checksum?: string;
}
