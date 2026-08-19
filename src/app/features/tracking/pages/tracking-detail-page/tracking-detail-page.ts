import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TrackingInfoCardsComponent } from '../../components/tracking-info-cards/tracking-info-cards';
import { TrackingResultSummaryComponent } from '../../components/tracking-result-summary/tracking-result-summary';
import { TrackingTimelineComponent } from '../../components/tracking-timeline/tracking-timeline';
import { TrackingStore } from '../../data-access/tracking.store';

@Component({
  selector: 'app-tracking-detail-page',
  imports: [TrackingResultSummaryComponent, TrackingInfoCardsComponent, TrackingTimelineComponent],
  providers: [TrackingStore],
  templateUrl: './tracking-detail-page.html',
  styleUrl: './tracking-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingDetailPageComponent implements OnInit {
  readonly orderId = input<string | null>(null);
  readonly trackingNumber = input<string | null>(null);
  readonly deliveryId = input<string | null>(null);

  private readonly store = inject(TrackingStore);
  private readonly router = inject(Router);

  readonly selected = this.store.selectedTracking;
  readonly loading = this.store.loadingDetail;
  readonly searching = this.store.loading;
  readonly error = this.store.error;
  readonly canViewOrder = this.store.canViewOrder;
  readonly canViewLogistics = this.store.canViewLogistics;

  ngOnInit(): void {
    if (this.orderId()) {
      this.store.loadByOrderId(this.orderId() ?? '');
      return;
    }

    if (this.trackingNumber()) {
      this.store.loadByTrackingNumber(this.trackingNumber() ?? '');
      return;
    }

    if (this.deliveryId()) {
      this.store.loadByOrderId(this.deliveryId() ?? '');
    }
  }

  back(): void {
    void this.router.navigate(['/rastreo']);
  }

  copy(value: string): void {
    void navigator.clipboard?.writeText(value);
  }

  openOffice(id: string): void {
    void this.router.navigate(['/oficina/pedidos', id]);
  }

  openLogistics(id: string): void {
    void this.router.navigate(['/torre-logistica/despachos', id]);
  }
}
