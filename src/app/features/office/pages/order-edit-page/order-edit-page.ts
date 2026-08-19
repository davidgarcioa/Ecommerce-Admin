import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { UpdateOrderRequest } from '../../data-access/office.models';
import { OfficeStore } from '../../data-access/office.store';

interface OrderEditForm {
  readonly customerName: FormControl<string>;
  readonly customerPhone: FormControl<string>;
  readonly customerEmail: FormControl<string>;
  readonly city: FormControl<string>;
  readonly department: FormControl<string>;
  readonly address: FormControl<string>;
  readonly carrier: FormControl<string>;
  readonly trackingNumber: FormControl<string>;
  readonly urgent: FormControl<boolean>;
  readonly observations: FormControl<string>;
}

@Component({
  selector: 'app-order-edit-page',
  imports: [ReactiveFormsModule],
  providers: [OfficeStore],
  templateUrl: './order-edit-page.html',
  styleUrl: './order-edit-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderEditPageComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly store = inject(OfficeStore);
  private readonly router = inject(Router);

  readonly order = this.store.selectedOrder;
  readonly loading = this.store.loadingDetail;
  readonly saving = this.store.saving;
  readonly error = this.store.error;

  readonly form = new FormGroup<OrderEditForm>({
    customerName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    customerPhone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    customerEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    department: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    carrier: new FormControl('', { nonNullable: true }),
    trackingNumber: new FormControl('', { nonNullable: true }),
    urgent: new FormControl(false, { nonNullable: true }),
    observations: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const order = this.order();
      if (!order) return;

      this.form.patchValue(
        {
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail ?? '',
          city: order.city,
          department: order.department,
          address: order.address,
          carrier: order.carrier ?? '',
          trackingNumber: order.trackingNumber ?? '',
          urgent: order.urgent,
          observations: order.observations ?? '',
        },
        { emitEvent: false },
      );
    });
  }

  ngOnInit(): void {
    this.store.loadOrderDetail(this.id());
  }

  back(): void {
    void this.router.navigate(['/oficina/pedidos', this.id()]);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: UpdateOrderRequest = {
      customerName: value.customerName.trim(),
      customerPhone: value.customerPhone.trim(),
      customerEmail: normalizeOptionalText(value.customerEmail),
      city: value.city.trim(),
      department: value.department.trim(),
      address: value.address.trim(),
      carrier: normalizeOptionalText(value.carrier),
      trackingNumber: normalizeOptionalText(value.trackingNumber),
      urgent: value.urgent,
      observations: normalizeOptionalText(value.observations),
    };

    this.store.updateOrder(this.id(), payload, () => this.back());
  }
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
