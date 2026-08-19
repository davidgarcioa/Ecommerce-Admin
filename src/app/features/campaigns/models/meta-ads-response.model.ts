export interface MetaApiPaging {
  readonly before?: string;
  readonly after?: string;
}

export interface MetaApiError {
  readonly message: string;
  readonly type: string;
  readonly code: number;
  readonly fbtraceId?: string;
}

export interface MetaCampaignResponse {
  readonly id: string;
  readonly name: string;
  readonly objective?: string;
  readonly status?: string;
  readonly account_id?: string;
  readonly daily_budget?: string;
  readonly lifetime_budget?: string;
  readonly start_time?: string;
  readonly stop_time?: string;
  readonly updated_time?: string;
}

export interface MetaAdSetResponse {
  readonly id: string;
  readonly campaign_id: string;
  readonly name: string;
  readonly status?: string;
  readonly optimization_goal?: string;
  readonly billing_event?: string;
  readonly daily_budget?: string;
  readonly start_time?: string;
  readonly end_time?: string;
  readonly updated_time?: string;
}

export interface MetaAdResponse {
  readonly id: string;
  readonly adset_id: string;
  readonly campaign_id: string;
  readonly name: string;
  readonly status?: string;
  readonly creative?: {
    readonly id?: string;
    readonly name?: string;
    readonly title?: string;
    readonly object_url?: string;
  };
  readonly updated_time?: string;
}

export interface MetaInsightsResponse {
  readonly spend?: string;
  readonly impressions?: string;
  readonly reach?: string;
  readonly clicks?: string;
  readonly actions?: readonly {
    readonly action_type: string;
    readonly value: string;
  }[];
  readonly action_values?: readonly {
    readonly action_type: string;
    readonly value: string;
  }[];
}
