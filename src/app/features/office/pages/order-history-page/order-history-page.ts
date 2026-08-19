import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { OfficeStore } from '../../data-access/office.store';
import { formatDate } from '../../utils/office.formatters';

@Component({
  selector: 'app-order-history-page',
  imports: [],
  providers: [OfficeStore],
  templateUrl: './order-history-page.html',
  styleUrl: './order-history-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderHistoryPageComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly store = inject(OfficeStore);
  private readonly router = inject(Router);

  readonly order = this.store.selectedOrder;
  readonly history = this.store.history;
  readonly loading = this.store.loadingDetail;
  readonly error = this.store.error;
  protected readonly formatDate = formatDate;

  ngOnInit(): void {
    this.store.loadOrderDetail(this.id());
  }

  back(): void {
    void this.router.navigate(['/oficina/pedidos', this.id()]);
  }
}
