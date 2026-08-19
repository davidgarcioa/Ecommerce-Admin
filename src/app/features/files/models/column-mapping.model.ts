export type ColumnMappingStatus = 'mapped' | 'unmapped' | 'suggested' | 'conflict' | 'invalid';

export interface ColumnMapping {
  readonly systemColumnKey: string;
  readonly sourceColumnName?: string;
  readonly confidence: number;
  readonly manuallySelected: boolean;
  readonly status: ColumnMappingStatus;
}
