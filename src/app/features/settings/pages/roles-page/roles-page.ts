import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { RoleListItem } from '../../data-access/settings.models';
import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-roles-page',
  imports: [DataTableComponent],
  templateUrl: './roles-page.html',
  styleUrl: './roles-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPageComponent {
  private readonly store = inject(SettingsStore);
  private readonly router = inject(Router);

  readonly roles = this.store.roleRows;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly totalRoles = this.store.totalRoles;
  readonly totalPermissions = this.store.totalPermissions;

  readonly columns = computed<readonly TableColumn<RoleListItem>[]>(() => [
    {
      key: 'name',
      label: 'Rol',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '12rem',
      align: 'left',
    },
    {
      key: 'description',
      label: 'Descripción',
      type: 'text',
      sortable: false,
      searchable: true,
      visible: true,
      minWidth: '18rem',
      align: 'left',
    },
    {
      key: 'statusLabel',
      label: 'Estado',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '8rem',
      align: 'left',
    },
    {
      key: 'permissionsCount',
      label: 'Permisos',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '7rem',
      align: 'right',
    },
    {
      key: 'systemLabel',
      label: 'Origen',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '10rem',
      align: 'left',
    },
    {
      key: 'updatedAt',
      label: 'Actualización',
      type: 'text',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '10rem',
      align: 'left',
    },
  ]);

  readonly rowActions = computed<readonly TableAction<RoleListItem>[]>(() => [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    { id: 'edit', label: 'Editar', icon: 'edit', variant: 'default' },
  ]);

  create(): void {
    void this.router.navigate(['/configuracion/roles/nuevo']);
  }

  openRole(role: RoleListItem): void {
    void this.router.navigate(['/configuracion/roles', role.id]);
  }

  refresh(): void {
    this.store.loadSettings();
  }

  onAction(event: TableActionClick<RoleListItem>): void {
    if (event.action.id === 'view') this.openRole(event.row);
    if (event.action.id === 'edit') {
      void this.router.navigate(['/configuracion/roles', event.row.id, 'editar']);
    }
  }
}
