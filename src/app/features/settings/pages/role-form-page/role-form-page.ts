import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PermissionCode } from '../../../../core/services/permissions.service';
import { RoleFormValue } from '../../data-access/settings.models';
import { SettingsStore } from '../../data-access/settings.store';
import { ROLE_OPTIONS } from '../../utils/settings.constants';

@Component({
  selector: 'app-role-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './role-form-page.html',
  styleUrl: './role-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleFormPageComponent {
  readonly id = input<string>();

  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly store = inject(SettingsStore);
  private readonly router = inject(Router);

  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly permissions = this.store.systemPermissions;
  readonly roleOptions = ROLE_OPTIONS;
  readonly selectedPermissions = signal<readonly PermissionCode[]>([]);
  readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  readonly role = computed(() => {
    const id = this.id();
    return id ? (this.store.roles().find((role) => role.id === id) ?? null) : null;
  });

  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(5)]],
    active: [true],
  });

  constructor() {
    effect(() => {
      const role = this.role();
      if (!role) return;

      this.form.patchValue({
        name: role.name,
        description: role.description,
        active: role.active,
      });
      this.selectedPermissions.set(role.permissions);
    });
  }

  togglePermission(permission: PermissionCode, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedPermissions.update((current) =>
      checked ? [...current, permission] : current.filter((item) => item !== permission),
    );
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = toRoleFormValue(this.form.getRawValue(), this.selectedPermissions());
    const id = this.id();

    if (id) {
      this.store.updateRole(id, value, (role) => {
        void this.router.navigate(['/configuracion/roles', role.id]);
      });
      return;
    }

    this.store.createRole(value, (role) => {
      void this.router.navigate(['/configuracion/roles', role.id]);
    });
  }
}

function toRoleFormValue(
  value: {
    readonly name: string;
    readonly description: string;
    readonly active: boolean;
  },
  permissions: readonly PermissionCode[],
): RoleFormValue {
  return {
    name: value.name,
    description: value.description,
    active: value.active,
    permissions,
  };
}
