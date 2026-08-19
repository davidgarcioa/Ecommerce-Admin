import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { LogisticsStore } from '../../data-access/logistics.store';

@Component({
  selector: 'app-returns-page',
  imports: [],
  providers: [LogisticsStore],
  templateUrl: './returns-page.html',
  styleUrl: './returns-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnsPageComponent implements OnInit {
  private readonly store = inject(LogisticsStore);
  private readonly router = inject(Router);

  readonly returns = this.store.returns;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.loadReturns();
  }

  back(): void {
    void this.router.navigate(['/torre-logistica']);
  }

  openReturn(id: string): void {
    void this.router.navigate(['/torre-logistica/devoluciones', id]);
  }
}
