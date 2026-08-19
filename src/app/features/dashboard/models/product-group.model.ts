import { DashboardMetric } from './dashboard-metric.model';

export type ProductGroupStatus = 'Activo' | 'Pausado' | 'Revision';

export interface ProductGroup {
  readonly id: string;
  readonly name: string;
  readonly productCount: number;
  readonly status: ProductGroupStatus;
  readonly description: string;
  readonly isActive: boolean;
  readonly lastUpdated: string;
  readonly metrics: readonly DashboardMetric[] | null;
}

export interface CreateProductGroupData {
  readonly name: string;
  readonly description: string;
  readonly status: ProductGroupStatus;
  readonly productCount: number;
}

export interface UpdateProductGroupData extends CreateProductGroupData {
  readonly id: string;
}
