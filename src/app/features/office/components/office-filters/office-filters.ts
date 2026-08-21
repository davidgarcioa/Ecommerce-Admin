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
  DEFAULT_ORDER_FILTERS,
  DELIVERY_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../../utils/office.constants';
import {
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../utils/order-status.utils';
import {
  DeliveryStatus,
  OrderFilters,
  OrderStatus,
  PaymentStatus,
} from '../../data-access/office.models';

export interface OfficeFilterApplyEvent {
  readonly search: string;
  readonly filters: OrderFilters;
}

interface OfficeSelectOption<TValue extends string> {
  readonly label: string;
  readonly value: TValue;
}

type OfficeFilterMenu = 'orderStatus' | 'paymentStatus' | 'deliveryStatus' | 'urgent';
type OrderStatusOption = OrderStatus | 'all';
type PaymentStatusOption = PaymentStatus | 'all';
type DeliveryStatusOption = DeliveryStatus | 'all';
type UrgencyOption = OrderFilters['urgent'];

@Component({
  selector: 'app-office-filters',
  templateUrl: './office-filters.html',
  styleUrl: './office-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeFiltersComponent {
  readonly search = input('');
  readonly filters = input.required<OrderFilters>();

  readonly apply = output<OfficeFilterApplyEvent>();
  readonly clear = output<void>();

  protected readonly currentSearch = signal('');
  protected readonly currentFilters = signal<OrderFilters>(DEFAULT_ORDER_FILTERS);
  protected readonly openMenu = signal<OfficeFilterMenu | null>(null);

  protected readonly orderStatusOptions: readonly OfficeSelectOption<OrderStatusOption>[] = [
    { label: 'Todos', value: 'all' },
    ...ORDER_STATUS_OPTIONS.map((status) => ({
      label: orderStatusLabel(status),
      value: status,
    })),
  ];
  protected readonly paymentStatusOptions: readonly OfficeSelectOption<PaymentStatusOption>[] = [
    { label: 'Todos', value: 'all' },
    ...PAYMENT_STATUS_OPTIONS.map((status) => ({
      label: paymentStatusLabel(status),
      value: status,
    })),
  ];
  protected readonly deliveryStatusOptions: readonly OfficeSelectOption<DeliveryStatusOption>[] = [
    { label: 'Todos', value: 'all' },
    ...DELIVERY_STATUS_OPTIONS.map((status) => ({
      label: deliveryStatusLabel(status),
      value: status,
    })),
  ];
  protected readonly urgencyOptions: readonly OfficeSelectOption<UrgencyOption>[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Urgentes', value: 'urgent' },
    { label: 'Normal', value: 'standard' },
  ];

  protected readonly activeFilterCount = computed(() => {
    const filters = this.currentFilters();

    return (
      Number(this.currentSearch().trim().length > 0) +
      Number(filters.orderStatus !== 'all') +
      Number(filters.paymentStatus !== 'all') +
      Number(filters.deliveryStatus !== 'all') +
      Number(filters.urgent !== 'all') +
      Number(filters.pendingConfirmation)
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

  protected toggleSelect(menu: OfficeFilterMenu): void {
    this.openMenu.update((current) => (current === menu ? null : menu));
  }

  protected isSelectOpen(menu: OfficeFilterMenu): boolean {
    return this.openMenu() === menu;
  }

  protected selectedOrderStatusLabel(): string {
    return findLabel(this.orderStatusOptions, this.currentFilters().orderStatus);
  }

  protected selectedPaymentStatusLabel(): string {
    return findLabel(this.paymentStatusOptions, this.currentFilters().paymentStatus);
  }

  protected selectedDeliveryStatusLabel(): string {
    return findLabel(this.deliveryStatusOptions, this.currentFilters().deliveryStatus);
  }

  protected selectedUrgencyLabel(): string {
    return findLabel(this.urgencyOptions, this.currentFilters().urgent);
  }

  protected onSearchChange(event: Event): void {
    this.currentSearch.set((event.target as HTMLInputElement).value);
  }

  protected selectOrderStatus(orderStatus: OrderStatusOption): void {
    this.patch({ orderStatus });
    this.closeSelects();
  }

  protected selectPaymentStatus(paymentStatus: PaymentStatusOption): void {
    this.patch({ paymentStatus });
    this.closeSelects();
  }

  protected selectDeliveryStatus(deliveryStatus: DeliveryStatusOption): void {
    this.patch({ deliveryStatus });
    this.closeSelects();
  }

  protected selectUrgency(urgent: UrgencyOption): void {
    this.patch({ urgent });
    this.closeSelects();
  }

  protected setPendingConfirmation(event: Event): void {
    this.patch({ pendingConfirmation: (event.target as HTMLInputElement).checked });
  }

  protected onApply(): void {
    this.apply.emit({
      search: this.currentSearch().trim(),
      filters: this.currentFilters(),
    });
  }

  protected onClear(): void {
    this.currentSearch.set('');
    this.currentFilters.set(DEFAULT_ORDER_FILTERS);
    this.closeSelects();
    this.clear.emit();
  }

  private patch(value: Partial<OrderFilters>): void {
    this.currentFilters.update((filters) => ({ ...filters, ...value }));
  }
}

function findLabel<TValue extends string>(
  options: readonly OfficeSelectOption<TValue>[],
  value: TValue,
): string {
  return options.find((option) => option.value === value)?.label ?? 'Todos';
}
