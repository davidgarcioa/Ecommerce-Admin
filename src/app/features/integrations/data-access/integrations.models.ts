export type IntegrationStatus = 'connected' | 'warning' | 'error' | 'pending';

export type IntegrationSection = 'general' | 'dropi' | 'firebase' | 'meta';

export interface HealthCheckItem {
  readonly status: 'ok' | 'warning' | 'error';
  readonly message: string;
}

export interface HealthCheckResponse {
  readonly api: HealthCheckItem;
  readonly environment: HealthCheckItem;
  readonly firestore: HealthCheckItem;
  readonly storage: HealthCheckItem;
}

export interface DropiIntegrationStatus {
  readonly configured: boolean;
  readonly authMode: 'auto' | 'static-token' | 'email-password' | 'missing';
  readonly baseUrlConfigured: boolean;
  readonly authHeader?: string;
  readonly ordersPath?: string;
  readonly userIdConfigured?: boolean;
  readonly pageSize: number;
}

export interface DropiAuthToken {
  readonly accessToken: string;
  readonly tokenType?: string;
  readonly expiresAt?: string;
}

export interface SyncDropiOrdersRequest {
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly pageSize?: number;
  readonly maxPages?: number;
  readonly dryRun?: boolean;
}

export interface DropiSyncSummary {
  readonly syncLogId: string;
  readonly importId: string;
  readonly received: number;
  readonly imported: number;
  readonly updated: number;
  readonly skipped: number;
  readonly errors: readonly string[];
}

export interface MetaIntegrationStatus {
  readonly configured: boolean;
  readonly configurationStatus: 'configured' | 'partial' | 'missing';
  readonly graphApiVersion: string;
  readonly appIdConfigured: boolean;
  readonly appSecretConfigured: boolean;
  readonly accessTokenConfigured: boolean;
  readonly adAccountConfigured: boolean;
  readonly businessConfigured: boolean;
}

export interface MetaConnectionCheck {
  readonly status: 'connected' | 'warning' | 'error';
  readonly message: string;
  readonly userId?: string;
  readonly accountId?: string;
  readonly accountName?: string;
  readonly currency?: string;
  readonly timezoneName?: string;
}

export interface MetaCampaignPreview {
  readonly id: string;
  readonly name: string;
  readonly status?: string;
  readonly effectiveStatus?: string;
  readonly objective?: string;
}

export interface MetaAdSetPreview {
  readonly id: string;
  readonly name: string;
  readonly campaignId?: string;
  readonly status?: string;
  readonly effectiveStatus?: string;
  readonly optimizationGoal?: string;
}

export interface MetaAdPreview {
  readonly id: string;
  readonly name: string;
  readonly campaignId?: string;
  readonly adSetId?: string;
  readonly status?: string;
  readonly effectiveStatus?: string;
}

export interface MetaInsightPreview {
  readonly campaignId?: string;
  readonly campaignName?: string;
  readonly spend?: number;
  readonly impressions?: number;
  readonly clicks?: number;
  readonly reach?: number;
  readonly ctr?: number;
  readonly cpc?: number;
  readonly cpm?: number;
  readonly dateStart?: string;
  readonly dateStop?: string;
}

export interface MetaAdsPreview {
  readonly accountId: string;
  readonly datePreset: string;
  readonly campaigns: readonly MetaCampaignPreview[];
  readonly adSets: readonly MetaAdSetPreview[];
  readonly ads: readonly MetaAdPreview[];
  readonly insights: readonly MetaInsightPreview[];
  readonly summary: {
    readonly campaigns: number;
    readonly adSets: number;
    readonly ads: number;
    readonly spend: number;
    readonly impressions: number;
    readonly clicks: number;
    readonly reach: number;
  };
}

export interface IntegrationCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: IntegrationStatus;
  readonly icon: string;
  readonly detail: string;
}

export interface IntegrationCheck {
  readonly label: string;
  readonly value: string;
  readonly status: IntegrationStatus;
}
