import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { LogisticsStore } from '../../data-access/logistics.store';

@Component({
  selector: 'app-deliveries-page',
  imports: [],
  providers: [LogisticsStore],
  templateUrl: './deliveries-page.html',
  styleUrl: './deliveries-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveriesPageComponent implements OnInit {
  private readonly store = inject(LogisticsStore);
  private readonly router = inject(Router);

  readonly deliveries = this.store.deliveries;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.loadDeliveries();
  }

  back(): void {
    void this.router.navigate(['/torre-logistica']);
  }
}
