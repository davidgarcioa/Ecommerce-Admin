import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  PRODUCT_GROUP_COLOR_OPTIONS,
  PRODUCT_GROUP_ICON_OPTIONS,
} from '../../utils/product-group.constants';
import {
  normalizeProductGroupCode,
  productGroupCodeValidator,
} from '../../utils/product-group.validators';
import {
  CreateProductGroupRequest,
  ProductGroup,
  ProductGroupFormValue,
  UpdateProductGroupRequest,
} from '../../data-access/product-groups.models';

type ProductGroupForm = FormGroup<{
  code: FormControl<string>;
  name: FormControl<string>;
  description: FormControl<string>;
  color: FormControl<string>;
  icon: FormControl<string>;
  active: FormControl<boolean>;
  featured: FormControl<boolean>;
  sortOrder: FormControl<number>;
}>;

@Component({
  selector: 'app-product-group-form',
  imports: [ReactiveFormsModule],
  templateUrl: './product-group-form.html',
  styleUrl: './product-group-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupFormComponent {
  readonly group = input<ProductGroup | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly mode = input<'create' | 'edit'>('create');

  readonly cancel = output<void>();
  readonly create = output<CreateProductGroupRequest>();
  readonly update = output<UpdateProductGroupRequest>();

  protected readonly colorOptions = PRODUCT_GROUP_COLOR_OPTIONS;
  protected readonly iconOptions = PRODUCT_GROUP_ICON_OPTIONS;

  protected readonly form: ProductGroupForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), productGroupCodeValidator],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(400)],
    }),
    color: new FormControl<string>(PRODUCT_GROUP_COLOR_OPTIONS[0], {
      nonNullable: true,
      validators: [Validators.required],
    }),
    icon: new FormControl<string>(PRODUCT_GROUP_ICON_OPTIONS[0], {
      nonNullable: true,
      validators: [Validators.required],
    }),
    active: new FormControl(true, { nonNullable: true }),
    featured: new FormControl(false, { nonNullable: true }),
    sortOrder: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0)],
    }),
  });

  constructor() {
    effect(() => {
      const group = this.group();
      if (!group) {
        return;
      }

      this.form.reset({
        code: group.code,
        name: group.name,
        description: group.description ?? '',
        color: group.color,
        icon: group.icon,
        active: group.active,
        featured: group.featured,
        sortOrder: group.sortOrder,
      });
      this.form.controls.code.disable();
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    const value = this.form.getRawValue();
    if (this.mode() === 'create') {
      this.create.emit(toCreateRequest(value));
      return;
    }

    this.update.emit(toUpdateRequest(value));
  }

  protected codeError(): string | null {
    const control = this.form.controls.code;
    if (!control.touched || control.valid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'El código es obligatorio.';
    }

    return 'Usa 2 a 30 caracteres en mayúsculas, números o guiones.';
  }

  protected nameError(): string | null {
    const control = this.form.controls.name;
    if (!control.touched || control.valid) {
      return null;
    }

    return 'El nombre debe tener entre 2 y 120 caracteres.';
  }
}

function toCreateRequest(value: ProductGroupFormValue): CreateProductGroupRequest {
  return {
    code: normalizeProductGroupCode(value.code),
    name: value.name.trim(),
    description: value.description.trim() || undefined,
    color: value.color,
    icon: value.icon,
    active: value.active,
    featured: value.featured,
    sortOrder: value.sortOrder,
  };
}

function toUpdateRequest(value: ProductGroupFormValue): UpdateProductGroupRequest {
  return {
    name: value.name.trim(),
    description: value.description.trim() || undefined,
    color: value.color,
    icon: value.icon,
    active: value.active,
    featured: value.featured,
    sortOrder: value.sortOrder,
  };
}
