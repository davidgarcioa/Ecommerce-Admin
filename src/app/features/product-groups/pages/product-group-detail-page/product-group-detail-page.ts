import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ProductGroupMetricsComponent } from '../../components/product-group-metrics/product-group-metrics';
import { ProductGroupProductsTableComponent } from '../../components/product-group-products-table/product-group-products-table';
import { ProductGroupsStore } from '../../data-access/product-groups.store';
import { formatDate } from '../../utils/product-group-formatters';

@Component({
  selector: 'app-product-group-detail-page',
  imports: [ProductGroupMetricsComponent, ProductGroupProductsTableComponent],
  providers: [ProductGroupsStore],
  templateUrl: './product-group-detail-page.html',
  styleUrl: './product-group-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupDetailPageComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly store = inject(ProductGroupsStore);
  private readonly router = inject(Router);

  readonly group = this.store.selectedGroup;
  readonly products = this.store.associatedProducts;
  readonly profitability = this.store.profitability;
  readonly history = this.store.history;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly canEdit = this.store.canEdit;
  readonly canArchive = this.store.canArchive;
  readonly canManageProducts = this.store.canManageProducts;

  protected readonly formatDate = formatDate;

  ngOnInit(): void {
    this.store.loadGroupDetail(this.id());
  }

  back(): void {
    void this.router.navigate(['/conjuntos']);
  }

  edit(): void {
    void this.router.navigate(['/conjuntos', this.id(), 'editar']);
  }

  productsPage(): void {
    void this.router.navigate(['/conjuntos', this.id(), 'productos']);
  }

  archive(): void {
    if (confirm('¿Archivar este conjunto?')) {
      this.store.archive(this.id());
    }
  }

  restore(): void {
    this.store.restore(this.id());
  }
}
