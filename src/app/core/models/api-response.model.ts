export interface ApiResponse<TData> {
  readonly success: boolean;
  readonly message: string;
  readonly data: TData;
  readonly meta: Record<string, unknown>;
  readonly timestamp: string;
  readonly requestId: string;
}
