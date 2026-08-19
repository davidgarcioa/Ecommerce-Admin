import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ProductGroupFormComponent } from '../../components/product-group-form/product-group-form';
import {
  CreateProductGroupRequest,
  UpdateProductGroupRequest,
} from '../../data-access/product-groups.models';
import { ProductGroupsStore } from '../../data-access/product-groups.store';

@Component({
  selector: 'app-product-group-form-page',
  imports: [ProductGroupFormComponent],
  providers: [ProductGroupsStore],
  templateUrl: './product-group-form-page.html',
  styleUrl: './product-group-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupFormPageComponent implements OnInit {
  readonly id = input<string>();

  private readonly store = inject(ProductGroupsStore);
  private readonly router = inject(Router);

  readonly group = this.store.selectedGroup;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;

  readonly mode = this.id() ? 'edit' : 'create';

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.store.loadGroupDetail(id);
    }
  }

  create(payload: CreateProductGroupRequest): void {
    this.store.create(payload, (group) => {
      void this.router.navigate(['/conjuntos', group.id]);
    });
  }

  update(payload: UpdateProductGroupRequest): void {
    const id = this.id();
    if (!id) {
      return;
    }

    this.store.update(id, payload, (group) => {
      void this.router.navigate(['/conjuntos', group.id]);
    });
  }

  cancel(): void {
    const id = this.id();
    void this.router.navigate(id ? ['/conjuntos', id] : ['/conjuntos']);
  }
}
