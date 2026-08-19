export type SynchronizationStatus = 'Exitosa' | 'Parcial' | 'Fallida' | 'En proceso';
export type SynchronizationType = 'Manual' | 'Automática' | 'Inicial';

export interface SynchronizationRecord {
  readonly id: string;
  readonly synchronizedAt: string;
  readonly type: SynchronizationType;
  readonly status: SynchronizationStatus;
  readonly campaignsProcessed: number;
  readonly adSetsProcessed: number;
  readonly adsProcessed: number;
  readonly durationMs: number;
  readonly message: string;
  readonly errorsFound: number;
}
