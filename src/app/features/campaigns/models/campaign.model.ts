export type CampaignStatus =
  'Activa' | 'Pausada' | 'En revisión' | 'Finalizada' | 'Con errores' | 'Archivada';

export type CampaignObjective =
  'Ventas' | 'Tráfico' | 'Interacción' | 'Clientes potenciales' | 'Reconocimiento';

export type AdvertisingPlatform =
  'Facebook' | 'Instagram' | 'Audience Network' | 'Messenger' | 'Varias plataformas';

export type BudgetType = 'Diario' | 'Total';

export interface Campaign {
  readonly id: string;
  readonly externalId?: string;
  readonly name: string;
  readonly objective: CampaignObjective;
  readonly status: CampaignStatus;
  readonly adAccountId: string;
  readonly adAccountName: string;
  readonly productGroupId: string;
  readonly productGroupName: string;
  readonly platform: AdvertisingPlatform;
  readonly budgetType: BudgetType;
  readonly dailyBudget?: number;
  readonly lifetimeBudget?: number;
  readonly amountSpent: number;
  readonly attributedRevenue: number;
  readonly impressions: number;
  readonly reach: number;
  readonly clicks: number;
  readonly purchases: number;
  readonly ctr: number | null;
  readonly cpc: number | null;
  readonly cpm: number | null;
  readonly cpa: number | null;
  readonly roas: number | null;
  readonly frequency: number | null;
  readonly startDate: string;
  readonly endDate?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSynchronizedAt: string;
  readonly hasWarnings: boolean;
  readonly warningMessage?: string;
}

export interface CampaignFormData {
  readonly name: string;
  readonly objective: CampaignObjective;
  readonly adAccountId: string;
  readonly status: CampaignStatus;
  readonly productGroupId: string;
  readonly platform: AdvertisingPlatform;
  readonly budgetType: BudgetType;
  readonly dailyBudget: number | null;
  readonly lifetimeBudget: number | null;
  readonly startDate: string;
  readonly endDate: string | null;
}
