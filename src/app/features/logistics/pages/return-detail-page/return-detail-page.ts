import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { LogisticsStore } from '../../data-access/logistics.store';

@Component({
  selector: 'app-return-detail-page',
  imports: [],
  providers: [LogisticsStore],
  templateUrl: './return-detail-page.html',
  styleUrl: './return-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnDetailPageComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly store = inject(LogisticsStore);
  private readonly router = inject(Router);

  readonly item = this.store.selectedReturn;
  readonly loading = this.store.loadingDetail;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.loadReturn(this.id());
  }

  back(): void {
    void this.router.navigate(['/torre-logistica/devoluciones']);
  }
}
