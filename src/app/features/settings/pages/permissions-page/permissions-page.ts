import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { PermissionListItem } from '../../data-access/settings.models';
import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-permissions-page',
  imports: [DataTableComponent],
  templateUrl: './permissions-page.html',
  styleUrl: './permissions-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsPageComponent {
  private readonly store = inject(SettingsStore);

  readonly permissions = this.store.permissionRows;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly totalPermissions = this.store.totalPermissions;

  readonly columns = computed<readonly TableColumn<PermissionListItem>[]>(() => [
    {
      key: 'code',
      label: 'Código',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '14rem',
      align: 'left',
    },
    {
      key: 'group',
      label: 'Grupo',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '10rem',
      align: 'left',
    },
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '14rem',
      align: 'left',
    },
    {
      key: 'source',
      label: 'Origen',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '8rem',
      align: 'left',
    },
  ]);

  refresh(): void {
    this.store.loadSettings();
  }
}
