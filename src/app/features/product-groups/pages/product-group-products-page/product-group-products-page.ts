import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AssociateProductsDialogComponent } from '../../components/associate-products-dialog/associate-products-dialog';
import { ProductGroupMetricsComponent } from '../../components/product-group-metrics/product-group-metrics';
import { ProductGroupProductsTableComponent } from '../../components/product-group-products-table/product-group-products-table';
import { ProductGroupProduct } from '../../data-access/product-groups.models';
import { ProductGroupsStore } from '../../data-access/product-groups.store';

@Component({
  selector: 'app-product-group-products-page',
  imports: [
    ProductGroupMetricsComponent,
    ProductGroupProductsTableComponent,
    AssociateProductsDialogComponent,
  ],
  providers: [ProductGroupsStore],
  templateUrl: './product-group-products-page.html',
  styleUrl: './product-group-products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupProductsPageComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly store = inject(ProductGroupsStore);
  private readonly router = inject(Router);

  readonly group = this.store.selectedGroup;
  readonly products = this.store.associatedProducts;
  readonly availableProducts = this.store.availableProducts;
  readonly profitability = this.store.profitability;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly canManageProducts = this.store.canManageProducts;
  readonly dialogOpen = signal(false);

  ngOnInit(): void {
    this.store.loadGroupDetail(this.id());
    this.store.searchProducts('');
  }

  back(): void {
    void this.router.navigate(['/conjuntos', this.id()]);
  }

  openAssociate(): void {
    this.dialogOpen.set(true);
    this.store.searchProducts('');
  }

  closeAssociate(): void {
    this.dialogOpen.set(false);
  }

  associate(productIds: readonly string[]): void {
    this.store.addProducts(this.id(), { productIds });
    this.dialogOpen.set(false);
  }

  searchProducts(term: string): void {
    this.store.searchProducts(term);
  }

  removeProduct(product: ProductGroupProduct): void {
    this.store.removeProduct(this.id(), product.id);
  }

  moveUp(product: ProductGroupProduct): void {
    this.reorder(product.id, -1);
  }

  moveDown(product: ProductGroupProduct): void {
    this.reorder(product.id, 1);
  }

  private reorder(productId: string, offset: -1 | 1): void {
    const products = this.products();
    const currentIndex = products.findIndex((product) => product.id === productId);
    const nextIndex = currentIndex + offset;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= products.length) {
      return;
    }

    const nextProducts = [...products];
    const [item] = nextProducts.splice(currentIndex, 1);
    if (!item) {
      return;
    }
    nextProducts.splice(nextIndex, 0, item);
    this.store.reorderProducts(this.id(), {
      productIds: nextProducts.map((product) => product.id),
    });
  }
}
