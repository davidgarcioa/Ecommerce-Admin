import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';

import {
  LogisticsDeliveryStatus,
  LogisticsFilters,
  LogisticsOrderStatus,
  LogisticsPaymentStatus,
} from '../../data-access/logistics.models';
import { DEFAULT_LOGISTICS_FILTERS } from '../../utils/logistics.constants';
import {
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../utils/logistics-status.utils';

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
] as const;
const DELIVERY_STATUSES = [
  'Pending',
  'Assigned',
  'In Transit',
  'Delivered',
  'Returned',
  'Failed',
] as const;
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded', 'Failed', 'Partial'] as const;

export interface LogisticsFilterApplyEvent {
  readonly search: string;
  readonly filters: LogisticsFilters;
}

interface LogisticsSelectOption<TValue extends string> {
  readonly label: string;
  readonly value: TValue;
}

type LogisticsFilterMenu = 'orderStatus' | 'deliveryStatus' | 'paymentStatus';
type OrderStatusOption = LogisticsOrderStatus | 'all';
type DeliveryStatusOption = LogisticsDeliveryStatus | 'all';
type PaymentStatusOption = LogisticsPaymentStatus | 'all';

@Component({
  selector: 'app-logistics-filters',
  templateUrl: './logistics-filters.html',
  styleUrl: './logistics-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsFiltersComponent {
  readonly search = input('');
  readonly filters = input.required<LogisticsFilters>();

  readonly apply = output<LogisticsFilterApplyEvent>();
  readonly clear = output<void>();

  protected readonly currentSearch = signal('');
  protected readonly currentFilters = signal<LogisticsFilters>(DEFAULT_LOGISTICS_FILTERS);
  protected readonly openMenu = signal<LogisticsFilterMenu | null>(null);

  protected readonly orderStatusOptions: readonly LogisticsSelectOption<OrderStatusOption>[] = [
    { label: 'Todos', value: 'all' },
    ...ORDER_STATUSES.map((status) => ({ label: orderStatusLabel(status), value: status })),
  ];
  protected readonly deliveryStatusOptions: readonly LogisticsSelectOption<DeliveryStatusOption>[] =
    [
      { label: 'Todas', value: 'all' },
      ...DELIVERY_STATUSES.map((status) => ({
        label: deliveryStatusLabel(status),
        value: status,
      })),
    ];
  protected readonly paymentStatusOptions: readonly LogisticsSelectOption<PaymentStatusOption>[] = [
    { label: 'Todos', value: 'all' },
    ...PAYMENT_STATUSES.map((status) => ({ label: paymentStatusLabel(status), value: status })),
  ];

  protected readonly activeFilterCount = computed(() => {
    const filters = this.currentFilters();

    return (
      Number(this.currentSearch().trim().length > 0) +
      Number(filters.orderStatus !== 'all') +
      Number(filters.deliveryStatus !== 'all') +
      Number(filters.paymentStatus !== 'all') +
      Number(filters.carrier.trim().length > 0) +
      Number(filters.city.trim().length > 0) +
      Number(filters.withoutTracking) +
      Number(filters.withIncident) +
      Number(filters.withReturn)
    );
  });

  constructor() {
    effect(() => {
      this.currentSearch.set(this.search());
      this.currentFilters.set({ ...this.filters() });
    });
  }

  @HostListener('document:click')
  closeSelects(): void {
    this.openMenu.set(null);
  }

  @HostListener('document:keydown.escape')
  closeSelectsOnEscape(): void {
    this.closeSelects();
  }

  protected toggleSelect(menu: LogisticsFilterMenu): void {
    this.openMenu.update((current) => (current === menu ? null : menu));
  }

  protected isSelectOpen(menu: LogisticsFilterMenu): boolean {
    return this.openMenu() === menu;
  }

  protected selectedOrderStatusLabel(): string {
    return findLabel(this.orderStatusOptions, this.currentFilters().orderStatus);
  }

  protected selectedDeliveryStatusLabel(): string {
    return findLabel(this.deliveryStatusOptions, this.currentFilters().deliveryStatus);
  }

  protected selectedPaymentStatusLabel(): string {
    return findLabel(this.paymentStatusOptions, this.currentFilters().paymentStatus);
  }

  protected onSearchChange(event: Event): void {
    this.currentSearch.set((event.target as HTMLInputElement).value);
  }

  protected setCarrier(event: Event): void {
    this.patch({ carrier: (event.target as HTMLInputElement).value });
  }

  protected setCity(event: Event): void {
    this.patch({ city: (event.target as HTMLInputElement).value });
  }

  protected selectOrderStatus(orderStatus: OrderStatusOption): void {
    this.patch({ orderStatus });
    this.closeSelects();
  }

  protected selectDeliveryStatus(deliveryStatus: DeliveryStatusOption): void {
    this.patch({ deliveryStatus });
    this.closeSelects();
  }

  protected selectPaymentStatus(paymentStatus: PaymentStatusOption): void {
    this.patch({ paymentStatus });
    this.closeSelects();
  }

  protected setWithoutTracking(event: Event): void {
    this.patch({ withoutTracking: (event.target as HTMLInputElement).checked });
  }

  protected setWithIncident(event: Event): void {
    this.patch({ withIncident: (event.target as HTMLInputElement).checked });
  }

  protected setWithReturn(event: Event): void {
    this.patch({ withReturn: (event.target as HTMLInputElement).checked });
  }

  protected onApply(): void {
    this.apply.emit({
      search: this.currentSearch().trim(),
      filters: this.currentFilters(),
    });
  }

  protected onClear(): void {
    this.currentSearch.set('');
    this.currentFilters.set(DEFAULT_LOGISTICS_FILTERS);
    this.closeSelects();
    this.clear.emit();
  }

  private patch(value: Partial<LogisticsFilters>): void {
    this.currentFilters.update((filters) => ({ ...filters, ...value }));
  }
}

function findLabel<TValue extends string>(
  options: readonly LogisticsSelectOption<TValue>[],
  value: TValue,
): string {
  return options.find((option) => option.value === value)?.label ?? 'Todos';
}
