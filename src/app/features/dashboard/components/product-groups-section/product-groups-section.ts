import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CreateProductGroupData,
  ProductGroup,
  ProductGroupStatus,
} from '../../models/product-group.model';
import {
  ProductGroupAction,
  ProductGroupCardComponent,
} from '../product-group-card/product-group-card';

@Component({
  selector: 'app-product-groups-section',
  imports: [ProductGroupCardComponent, RouterLink],
  templateUrl: './product-groups-section.html',
  styleUrl: './product-groups-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupsSectionComponent {
  readonly productGroups = input.required<readonly ProductGroup[]>();
  readonly activeProductGroupId = input.required<string>();
  readonly pendingDeleteProductGroupId = input<string | null>(null);

  readonly selectProductGroup = output<string>();
  readonly productGroupAction = output<{
    readonly action: ProductGroupAction;
    readonly productGroupId: string;
  }>();
  readonly createProductGroup = output<CreateProductGroupData>();
  readonly confirmDeleteProductGroup = output<void>();
  readonly cancelDeleteProductGroup = output<void>();

  readonly createFormVisible = signal(false);
  readonly name = signal('');
  readonly description = signal('');
  readonly status = signal<ProductGroupStatus>('Activo');
  readonly productCount = signal(0);

  readonly nameError = computed(() => {
    const name = this.name().trim();

    if (name.length === 0) {
      return 'El nombre es obligatorio.';
    }

    if (name.length < 3) {
      return 'Usa mínimo 3 caracteres.';
    }

    if (name.length > 60) {
      return 'Usa máximo 60 caracteres.';
    }

    return null;
  });

  readonly productCountError = computed(() =>
    this.productCount() < 0 ? 'La cantidad no puede ser negativa.' : null,
  );

  readonly formValid = computed(
    () => this.nameError() === null && this.productCountError() === null,
  );

  onSelectProductGroup(productGroupId: string): void {
    this.selectProductGroup.emit(productGroupId);
  }

  onProductGroupAction(event: {
    readonly action: ProductGroupAction;
    readonly productGroupId: string;
  }): void {
    this.productGroupAction.emit(event);
  }

  onToggleCreateForm(): void {
    this.createFormVisible.update((visible) => !visible);
  }

  onNameChange(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onDescriptionChange(event: Event): void {
    this.description.set((event.target as HTMLInputElement).value);
  }

  onStatusChange(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as ProductGroupStatus);
  }

  onProductCountChange(event: Event): void {
    this.productCount.set(Number((event.target as HTMLInputElement).value));
  }

  onSaveProductGroup(): void {
    if (!this.formValid()) {
      return;
    }

    this.createProductGroup.emit({
      name: this.name(),
      description: this.description(),
      status: this.status(),
      productCount: this.productCount(),
    });
    this.resetForm();
  }

  onConfirmDeleteProductGroup(): void {
    this.confirmDeleteProductGroup.emit();
  }

  onCancelDeleteProductGroup(): void {
    this.cancelDeleteProductGroup.emit();
  }

  private resetForm(): void {
    this.name.set('');
    this.description.set('');
    this.status.set('Activo');
    this.productCount.set(0);
    this.createFormVisible.set(false);
  }
}
