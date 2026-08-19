import { PermissionCode } from '../../../core/services/permissions.service';

export interface HomeUserSummary {
  readonly id: string;
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly displayName?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly PermissionCode[];
}

export interface HomeQuickAccessItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly icon: string;
  readonly route: string;
  readonly permissions: readonly PermissionCode[];
  readonly order: number;
}

export interface HomeModuleSummary {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly description: string;
  readonly route: string;
  readonly icon: string;
}

export type HomeWorkItemKind = 'pending' | 'attention';
export type HomeWorkItemLevel = 'info' | 'warning' | 'critical';

export interface HomeWorkItem {
  readonly id: string;
  readonly kind: HomeWorkItemKind;
  readonly level: HomeWorkItemLevel;
  readonly title: string;
  readonly module: string;
  readonly description: string;
  readonly route: string;
  readonly count: number;
}

export interface HomeOverview {
  readonly summaries: readonly HomeModuleSummary[];
  readonly pendingItems: readonly HomeWorkItem[];
  readonly attentionItems: readonly HomeWorkItem[];
  readonly partialErrors: readonly string[];
  readonly loadedAt: string;
}

export interface OrderHomeStatistics {
  readonly totalOrders: number;
  readonly sales: number;
  readonly cancelled: number;
  readonly delivered: number;
  readonly inTransit: number;
  readonly urgent: number;
}

export interface TestingHomeStatistics {
  readonly total: number;
  readonly active: number;
  readonly draft: number;
  readonly paused: number;
}

export interface TagHomeStatistics {
  readonly total: number;
  readonly active: number;
  readonly unused: number;
}

export interface ProductGroupHomeStatistics {
  readonly total: number;
  readonly active: number;
  readonly archived: number;
  readonly associatedProducts: number;
}

export interface FileHomeStatistics {
  readonly total: number;
  readonly active: number;
  readonly archived: number;
  readonly withoutRelation: number;
}

export interface HomeStatisticsResponse {
  readonly orders: OrderHomeStatistics | null;
  readonly testing: TestingHomeStatistics | null;
  readonly tags: TagHomeStatistics | null;
  readonly productGroups: ProductGroupHomeStatistics | null;
  readonly files: FileHomeStatistics | null;
  readonly errors: readonly string[];
}
