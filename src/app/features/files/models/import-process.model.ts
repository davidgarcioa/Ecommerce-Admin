export type ImportStepId =
  'type' | 'file' | 'sheet' | 'preview' | 'mapping' | 'validation' | 'confirmation' | 'result';

export interface ImportStep {
  readonly id: ImportStepId;
  readonly label: string;
}

export interface ImportProgress {
  readonly active: boolean;
  readonly progress: number;
  readonly stage: string;
  readonly processedRows: number;
  readonly elapsedMs: number;
  readonly cancellable: boolean;
}

export interface ImportResult {
  readonly id: string;
  readonly status: 'completed' | 'partial' | 'failed' | 'cancelled';
  readonly importedRows: number;
  readonly omittedRows: number;
  readonly warnings: number;
  readonly durationMs: number;
  readonly createdAt: string;
  readonly message: string;
}
