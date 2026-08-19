export type OrderStatus =
  | 'Pendiente'
  | 'Confirmada'
  | 'En preparación'
  | 'Despachada'
  | 'En tránsito'
  | 'Entregada'
  | 'Devuelta'
  | 'Cancelada';

export type PaymentMethod = 'Contraentrega' | 'Transferencia' | 'Tarjeta' | 'PSE' | 'Otro';
export type Carrier = string;

export interface DailyOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly createdAt: string;
  readonly reportDate?: string;
  readonly orderHour?: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly customerEmail?: string;
  readonly customerDocumentType?: string;
  readonly customerDocumentNumber?: string;
  readonly productName: string;
  readonly productGroupId: string;
  readonly productGroupName: string;
  readonly guideNumber?: string;
  readonly guideStatus?: string;
  readonly shippingType?: string;
  readonly department?: string;
  readonly city: string;
  readonly address?: string;
  readonly notes?: string;
  readonly carrier: Carrier;
  readonly status: OrderStatus;
  readonly orderValue: number;
  readonly advertisingCost: number;
  readonly estimatedProfit: number;
  readonly shippingCost?: number;
  readonly returnShippingCost?: number;
  readonly commission?: number;
  readonly commissionPercentage?: number;
  readonly providerCost?: number;
  readonly providerCostTotal?: number;
  readonly productId?: string;
  readonly sku?: string;
  readonly variationId?: string;
  readonly variation?: string;
  readonly quantity?: number;
  readonly novelty?: string;
  readonly noveltySolved?: boolean;
  readonly noveltyAt?: string;
  readonly solution?: string;
  readonly solvedAt?: string;
  readonly observation?: string;
  readonly lastMovementAt?: string;
  readonly lastMovement?: string;
  readonly lastMovementConcept?: string;
  readonly lastMovementLocation?: string;
  readonly seller?: string;
  readonly storeType?: string;
  readonly storeName?: string;
  readonly storeOrderId?: string;
  readonly storeOrderNumber?: string;
  readonly tags?: string;
  readonly guideGeneratedAt?: string;
  readonly indemnizationCount?: number;
  readonly lastIndemnizationConcept?: string;
  readonly operationDays: number;
  readonly urgent: boolean;
  readonly paymentMethod: PaymentMethod;
  readonly lastUpdated: string;
}
