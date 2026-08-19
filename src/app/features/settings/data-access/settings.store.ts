import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';

import { PermissionCode, PermissionsService } from '../../../core/services/permissions.service';
import {
  AdminRole,
  AdminUser,
  CreateRoleRequest,
  CreateUserRequest,
  PersistedPermission,
  RoleFormValue,
  SettingsProfile,
  UpdateRoleRequest,
  UpdateUserRequest,
  UserFormValue,
} from './settings.models';
import {
  readProfileFromToken,
  toPermissionListItem,
  toRoleListItem,
  toUserListItem,
} from './settings.mapper';
import { SettingsApiService } from './settings-api.service';

@Injectable()
export class SettingsStore {
  private readonly api = inject(SettingsApiService);
  private readonly permissionsService = inject(PermissionsService);

  private readonly usersState = signal<readonly AdminUser[]>([]);
  private readonly rolesState = signal<readonly AdminRole[]>([]);
  private readonly systemPermissionsState = signal<readonly PermissionCode[]>([]);
  private readonly persistedPermissionsState = signal<readonly PersistedPermission[]>([]);
  private readonly profileState = signal<SettingsProfile | null>(readProfileFromToken());
  private readonly selectedUserState = signal<AdminUser | null>(null);
  private readonly selectedRoleState = signal<AdminRole | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly users = this.usersState.asReadonly();
  readonly roles = this.rolesState.asReadonly();
  readonly systemPermissions = this.systemPermissionsState.asReadonly();
  readonly profile = this.profileState.asReadonly();
  readonly selectedUser = this.selectedUserState.asReadonly();
  readonly selectedRole = this.selectedRoleState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly canManageUsers = computed(() => this.permissionsService.has('users.manage'));
  readonly canManageRoles = computed(() => this.permissionsService.has('roles.manage'));
  readonly canManageSettings = computed(() => this.permissionsService.has('settings.manage'));

  readonly userRows = computed(() => this.usersState().map(toUserListItem));
  readonly roleRows = computed(() => this.rolesState().map(toRoleListItem));
  readonly permissionRows = computed(() => {
    const persistedCodes = new Set(this.persistedPermissionsState().map((item) => item.code));
    const systemRows = this.systemPermissionsState()
      .filter((permission) => !persistedCodes.has(permission))
      .map(toPermissionListItem);
    const persistedRows = this.persistedPermissionsState().map(toPermissionListItem);

    return [...persistedRows, ...systemRows].sort((a, b) => a.code.localeCompare(b.code));
  });

  readonly totalUsers = computed(() => this.usersState().length);
  readonly activeUsers = computed(() => this.usersState().filter((user) => user.active).length);
  readonly inactiveUsers = computed(() => this.totalUsers() - this.activeUsers());
  readonly pendingUsers = computed(
    () => this.usersState().filter((user) => !user.active && user.emailVerified).length,
  );
  readonly totalRoles = computed(() => this.rolesState().length);
  readonly totalPermissions = computed(() => this.permissionRows().length);

  loadSettings(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.profileState.set(readProfileFromToken());

    forkJoin({
      users: this.canManageUsers() ? this.api.listUsers() : of<readonly AdminUser[]>([]),
      roles: this.canManageRoles() ? this.api.listRoles() : of<readonly AdminRole[]>([]),
      systemPermissions: this.canManageRoles()
        ? this.api.systemPermissions()
        : of<readonly PermissionCode[]>([]),
      persistedPermissions: this.canManageRoles()
        ? this.api.persistedPermissions()
        : of<readonly PersistedPermission[]>([]),
    }).subscribe({
      next: (state) => {
        this.usersState.set(state.users);
        this.rolesState.set(state.roles);
        this.systemPermissionsState.set(state.systemPermissions);
        this.persistedPermissionsState.set(state.persistedPermissions);
        this.loadingState.set(false);
      },
      error: (error: Error) => {
        this.errorState.set(error.message);
        this.loadingState.set(false);
      },
    });
  }

  selectUser(id: string): void {
    this.selectedUserState.set(this.usersState().find((user) => user.id === id) ?? null);
  }

  selectRole(id: string): void {
    this.selectedRoleState.set(this.rolesState().find((role) => role.id === id) ?? null);
  }

  createUser(value: UserFormValue, onSuccess: (user: AdminUser) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api.createUser(toCreateUserRequest(value)).subscribe({
      next: (user) => {
        this.usersState.update((users) => [...users, user]);
        this.savingState.set(false);
        onSuccess(user);
      },
      error: (error: Error) => this.handleSaveError(error),
    });
  }

  updateUser(id: string, value: UserFormValue, onSuccess: (user: AdminUser) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api.updateUser(id, toUpdateUserRequest(value)).subscribe({
      next: (user) => {
        this.usersState.update((users) => users.map((item) => (item.id === user.id ? user : item)));
        this.selectedUserState.set(user);
        this.savingState.set(false);
        onSuccess(user);
      },
      error: (error: Error) => this.handleSaveError(error),
    });
  }

  createRole(value: RoleFormValue, onSuccess: (role: AdminRole) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api.createRole(value).subscribe({
      next: (role) => {
        this.rolesState.update((roles) => [...roles, role]);
        this.savingState.set(false);
        onSuccess(role);
      },
      error: (error: Error) => this.handleSaveError(error),
    });
  }

  updateRole(id: string, value: RoleFormValue, onSuccess: (role: AdminRole) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api.updateRole(id, toUpdateRoleRequest(value)).subscribe({
      next: (role) => {
        this.rolesState.update((roles) => roles.map((item) => (item.id === role.id ? role : item)));
        this.selectedRoleState.set(role);
        this.savingState.set(false);
        onSuccess(role);
      },
      error: (error: Error) => this.handleSaveError(error),
    });
  }

  private handleSaveError(error: Error): void {
    this.errorState.set(error.message);
    this.savingState.set(false);
  }
}

function toCreateUserRequest(value: UserFormValue): CreateUserRequest {
  return {
    email: value.email.trim(),
    username: value.username.trim(),
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    roleId: value.roleId,
    password: value.password,
    phone: value.phone.trim(),
    active: value.active,
    emailVerified: value.emailVerified,
    permissions: value.permissions,
  };
}

function toUpdateUserRequest(value: UserFormValue): UpdateUserRequest {
  return {
    email: value.email.trim(),
    username: value.username.trim(),
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    roleId: value.roleId,
    phone: value.phone.trim(),
    active: value.active,
    emailVerified: value.emailVerified,
    permissions: value.permissions,
  };
}

function toUpdateRoleRequest(value: RoleFormValue): UpdateRoleRequest {
  return {
    name: value.name,
    description: value.description.trim(),
    active: value.active,
    permissions: value.permissions,
  };
}
