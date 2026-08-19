import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { DispatchDetailPanelComponent } from '../../components/dispatch-detail-panel/dispatch-detail-panel';
import { LogisticsDeliveryStatus, UpdateShipmentRequest } from '../../data-access/logistics.models';
import { LogisticsStore } from '../../data-access/logistics.store';
import { LOGISTICS_DELIVERY_STATUS_TRANSITIONS } from '../../utils/logistics.constants';
import { isValidCarrier, isValidTrackingNumber } from '../../utils/logistics.validators';
import { deliveryStatusLabel } from '../../utils/logistics-status.utils';

interface ShipmentForm {
  readonly carrier: FormControl<string>;
  readonly trackingNumber: FormControl<string>;
  readonly observations: FormControl<string>;
}

@Component({
  selector: 'app-dispatch-detail-page',
  imports: [ReactiveFormsModule, DispatchDetailPanelComponent],
  providers: [LogisticsStore],
  templateUrl: './dispatch-detail-page.html',
  styleUrl: './dispatch-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchDetailPageComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly store = inject(LogisticsStore);
  private readonly router = inject(Router);

  readonly order = this.store.selectedOrder;
  readonly history = this.store.history;
  readonly loading = this.store.loadingDetail;
  readonly saving = this.store.saving;
  readonly updatingStatus = this.store.updatingStatus;
  readonly error = this.store.error;
  readonly canUpdate = this.store.canUpdateShipment;

  readonly form = new FormGroup<ShipmentForm>({
    carrier: new FormControl('', { nonNullable: true }),
    trackingNumber: new FormControl('', { nonNullable: true }),
    observations: new FormControl('', { nonNullable: true }),
  });

  protected readonly deliveryStatusLabel = deliveryStatusLabel;

  constructor() {
    effect(() => {
      const order = this.order();
      if (!order) return;
      this.form.patchValue(
        {
          carrier: order.carrier ?? '',
          trackingNumber: order.trackingNumber ?? '',
          observations: order.observations ?? '',
        },
        { emitEvent: false },
      );
    });
  }

  ngOnInit(): void {
    this.store.loadDetail(this.id());
  }

  back(): void {
    void this.router.navigate(['/torre-logistica']);
  }

  openOffice(): void {
    void this.router.navigate(['/oficina/pedidos', this.id()]);
  }

  saveShipment(): void {
    const value = this.form.getRawValue();
    if (!isValidCarrier(value.carrier) || !isValidTrackingNumber(value.trackingNumber)) {
      return;
    }

    const payload: UpdateShipmentRequest = {
      carrier: normalize(value.carrier),
      trackingNumber: normalize(value.trackingNumber),
      observations: normalize(value.observations),
    };

    this.store.updateShipment(this.id(), payload);
  }

  nextDeliveryStatus(): void {
    const order = this.order();
    if (!order) return;
    this.store.nextDeliveryStatus(this.id(), order.deliveryStatus);
  }

  protected nextDeliveryLabel(status: LogisticsDeliveryStatus): string {
    const next = LOGISTICS_DELIVERY_STATUS_TRANSITIONS[status][0];
    return next ? deliveryStatusLabel(next) : 'Sin transición';
  }
}

function normalize(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
