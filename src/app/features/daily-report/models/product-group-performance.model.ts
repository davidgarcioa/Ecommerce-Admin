export interface ProductGroupPerformance {
  readonly id: string;
  readonly name: string;
  readonly productCount: number;
  readonly orders: number;
  readonly sales: number;
  readonly deliveries: number;
  readonly deliveryRate: number;
  readonly returns: number;
  readonly cpa: number;
  readonly roas: number;
  readonly estimatedProfit: number;
}
