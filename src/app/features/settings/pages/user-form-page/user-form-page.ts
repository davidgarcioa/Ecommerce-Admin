import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PermissionCode } from '../../../../core/services/permissions.service';
import { UserFormValue } from '../../data-access/settings.models';
import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-user-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form-page.html',
  styleUrl: './user-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormPageComponent {
  readonly id = input<string>();

  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly store = inject(SettingsStore);
  private readonly router = inject(Router);

  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly roles = this.store.roles;
  readonly permissions = this.store.systemPermissions;
  readonly selectedPermissions = signal<readonly PermissionCode[]>([]);
  readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  readonly user = computed(() => {
    const id = this.id();
    return id ? this.store.users().find((user) => user.id === id) ?? null : null;
  });
  readonly pendingReview = computed(() => {
    const user = this.user();
    return Boolean(user && !user.active && user.emailVerified);
  });

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    roleId: ['', Validators.required],
    password: ['', [Validators.minLength(8)]],
    phone: [''],
    active: [true],
    emailVerified: [false],
  });

  constructor() {
    effect(() => {
      const user = this.user();
      if (!user) return;

      this.form.patchValue({
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        password: '',
        phone: user.phone ?? '',
        active: user.active,
        emailVerified: user.emailVerified,
      });
      this.selectedPermissions.set(user.permissions);
    });
  }

  togglePermission(permission: PermissionCode, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedPermissions.update((current) =>
      checked ? [...current, permission] : current.filter((item) => item !== permission),
    );
  }

  applyRolePermissions(): void {
    const roleId = this.form.controls.roleId.value;
    const role = this.roles().find((item) => item.id === roleId || item.name === roleId);

    if (!role) {
      this.selectedPermissions.set([]);
      return;
    }

    this.selectedPermissions.set(role.permissions);

    if (this.pendingReview()) {
      this.form.controls.active.setValue(true);
      this.form.controls.emailVerified.setValue(true);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = toUserFormValue(this.form.getRawValue(), this.selectedPermissions());
    const id = this.id();

    if (id) {
      this.store.updateUser(id, value, (user) => {
        void this.router.navigate(['/configuracion/usuarios', user.id]);
      });
      return;
    }

    if (!value.password) {
      this.form.controls.password.setErrors({ required: true });
      return;
    }

    this.store.createUser(value, (user) => {
      void this.router.navigate(['/configuracion/usuarios', user.id]);
    });
  }
}

function toUserFormValue(
  value: {
    readonly email: string;
    readonly username: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly roleId: string;
    readonly password: string;
    readonly phone: string;
    readonly active: boolean;
    readonly emailVerified: boolean;
  },
  permissions: readonly PermissionCode[],
): UserFormValue {
  return {
    email: value.email,
    username: value.username,
    firstName: value.firstName,
    lastName: value.lastName,
    roleId: value.roleId,
    password: value.password,
    phone: value.phone,
    active: value.active,
    emailVerified: value.emailVerified,
    permissions,
  };
}
