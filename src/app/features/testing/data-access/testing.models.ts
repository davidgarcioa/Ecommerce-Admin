export type TestingStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type TestingType = 'campaign' | 'creative' | 'product-group' | 'product' | 'offer' | 'operational';
export type TestingAssociationType = 'campaign' | 'product-group' | 'product' | 'order' | 'none';
export type TestingSortOption = 'updatedAt' | 'name' | 'startDate' | 'status';

export interface TestingAssociation {
  readonly type: TestingAssociationType;
  readonly entityId?: string;
  readonly label: string;
}

export interface EcommerceTest {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly type: TestingType;
  readonly status: TestingStatus;
  readonly objective: string;
  readonly hypothesis: string;
  readonly association: TestingAssociation;
  readonly startDate: string;
  readonly endDate?: string;
  readonly owner: string;
  readonly resultSummary?: string;
  readonly winner?: string;
  readonly createdBy: string;
  readonly archivedAt?: string;
  readonly archivedBy?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TestingListItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: TestingType;
  readonly typeLabel: string;
  readonly status: TestingStatus;
  readonly statusLabel: string;
  readonly objective: string;
  readonly associationLabel: string;
  readonly associationType: TestingAssociationType;
  readonly startDate: string;
  readonly endDate: string;
  readonly owner: string;
  readonly updatedAt: string;
}

export interface TestingStatistics {
  readonly total: number;
  readonly active: number;
  readonly completed: number;
  readonly archived: number;
  readonly draft: number;
  readonly paused: number;
}

export interface TestingFilters {
  readonly status: TestingStatus | 'all';
  readonly type: TestingType | 'all';
  readonly associationType: TestingAssociationType | 'all';
}

export interface TestingFormValue {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly type: TestingType;
  readonly status: TestingStatus;
  readonly objective: string;
  readonly hypothesis: string;
  readonly associationType: TestingAssociationType;
  readonly associationEntityId: string;
  readonly associationLabel: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly owner: string;
  readonly resultSummary: string;
  readonly winner: string;
}

export interface CreateTestingRequest {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly type: TestingType;
  readonly status?: TestingStatus;
  readonly objective: string;
  readonly hypothesis: string;
  readonly association: TestingAssociation;
  readonly startDate: string;
  readonly endDate?: string;
  readonly owner: string;
  readonly resultSummary?: string;
  readonly winner?: string;
}

export type UpdateTestingRequest = Partial<CreateTestingRequest>;
