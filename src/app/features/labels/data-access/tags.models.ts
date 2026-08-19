export type TagStatus = 'active' | 'inactive' | 'archived';
export type TagSortOption = 'name' | 'code' | 'usageCount' | 'updatedAt';

export interface Tag {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly status: TagStatus;
  readonly active: boolean;
  readonly usageCount: number;
  readonly createdBy: string;
  readonly archivedAt?: string;
  readonly archivedBy?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TagListItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly status: TagStatus;
  readonly statusLabel: string;
  readonly activeLabel: string;
  readonly usageCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TagStatistics {
  readonly total: number;
  readonly active: number;
  readonly inactive: number;
  readonly archived: number;
  readonly used: number;
  readonly unused: number;
  readonly totalAssociations: number;
  readonly mostUsedTag: Pick<Tag, 'id' | 'name' | 'usageCount'> | null;
}

export interface TagFilters {
  readonly status: TagStatus | 'all';
  readonly usage: 'all' | 'used' | 'unused';
}

export interface TagFormValue {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly active: boolean;
}

export interface CreateTagRequest {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly active: boolean;
}

export interface UpdateTagRequest {
  readonly code?: string;
  readonly name?: string;
  readonly description?: string;
  readonly color?: string;
  readonly active?: boolean;
}
