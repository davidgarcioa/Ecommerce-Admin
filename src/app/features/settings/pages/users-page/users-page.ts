import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableAction, TableActionClick } from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { UserListItem } from '../../data-access/settings.models';
import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-users-page',
  imports: [DataTableComponent],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {
  private readonly store = inject(SettingsStore);
  private readonly router = inject(Router);

  readonly users = this.store.userRows;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly totalUsers = this.store.totalUsers;
  readonly activeUsers = this.store.activeUsers;
  readonly inactiveUsers = this.store.inactiveUsers;
  readonly pendingUsers = this.store.pendingUsers;

  readonly columns = computed<readonly TableColumn<UserListItem>[]>(() => [
    { key: 'name', label: 'Usuario', type: 'text', sortable: true, searchable: true, visible: true, minWidth: '12rem', align: 'left' },
    { key: 'email', label: 'Correo', type: 'text', sortable: true, searchable: true, visible: true, minWidth: '14rem', align: 'left' },
    { key: 'username', label: 'Alias', type: 'text', sortable: true, searchable: true, visible: true, minWidth: '8rem', align: 'left' },
    { key: 'roleId', label: 'Rol', type: 'text', sortable: true, searchable: true, visible: true, minWidth: '10rem', align: 'left' },
    { key: 'statusLabel', label: 'Estado', type: 'status', sortable: true, searchable: true, visible: true, minWidth: '8rem', align: 'left' },
    { key: 'verificationLabel', label: 'Verificación', type: 'text', sortable: true, searchable: true, visible: true, minWidth: '10rem', align: 'left' },
    { key: 'permissionsCount', label: 'Permisos', type: 'number', sortable: true, searchable: false, visible: true, minWidth: '7rem', align: 'right' },
    { key: 'lastLogin', label: 'Último acceso', type: 'text', sortable: true, searchable: false, visible: true, minWidth: '10rem', align: 'left' },
  ]);

  readonly rowActions = computed<readonly TableAction<UserListItem>[]>(() => [
    {
      id: 'approve',
      label: 'Revisar acceso',
      icon: 'admin_panel_settings',
      variant: 'primary',
      hidden: (user) => user.statusLabel !== 'Pendiente',
    },
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    { id: 'edit', label: 'Editar', icon: 'edit', variant: 'default' },
  ]);

  create(): void {
    void this.router.navigate(['/configuracion/usuarios/nuevo']);
  }

  openUser(user: UserListItem): void {
    void this.router.navigate(['/configuracion/usuarios', user.id]);
  }

  refresh(): void {
    this.store.loadSettings();
  }

  onAction(event: TableActionClick<UserListItem>): void {
    if (event.action.id === 'approve') void this.router.navigate(['/configuracion/usuarios', event.row.id, 'editar']);
    if (event.action.id === 'view') this.openUser(event.row);
    if (event.action.id === 'edit') void this.router.navigate(['/configuracion/usuarios', event.row.id, 'editar']);
  }
}
