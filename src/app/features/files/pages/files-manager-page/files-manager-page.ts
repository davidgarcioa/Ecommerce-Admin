import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { FILES_TABLE_PREFERENCES_KEY } from '../../utils/files.constants';
import { formatDateTime, formatFileSize, formatNumber } from '../../utils/files.formatters';
import { FileFilters, ManagedFileListItem } from '../../data-access/files.models';
import { FilesStore } from '../../data-access/files.store';

@Component({
  selector: 'app-files-manager-page',
  imports: [DataTableComponent],
  providers: [FilesStore],
  templateUrl: './files-manager-page.html',
  styleUrl: './files-manager-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesManagerPageComponent implements OnInit {
  private readonly store = inject(FilesStore);
  private readonly router = inject(Router);

  readonly files = this.store.filteredFiles;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly search = this.store.search;
  readonly filters = this.store.filters;
  readonly totalFiles = this.store.totalFiles;
  readonly activeFiles = this.store.activeFiles;
  readonly archivedFiles = this.store.archivedFiles;
  readonly images = this.store.images;
  readonly documents = this.store.documents;
  readonly totalSize = this.store.totalSize;
  readonly lastUpdated = this.store.lastUpdated;
  readonly preferencesKey = FILES_TABLE_PREFERENCES_KEY;
  readonly filtersOpen = signal(false);
  readonly activeFilterCount = computed(() => {
    const filters = this.filters();
    return [
      filters.status !== 'all',
      filters.category !== 'all',
      filters.visibility !== 'all',
      this.search().trim().length > 0,
    ].filter(Boolean).length;
  });

  readonly columns = computed<readonly TableColumn<ManagedFileListItem>[]>(() => [
    {
      key: 'displayName',
      label: 'Archivo',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '14rem',
      align: 'left',
    },
    {
      key: 'categoryLabel',
      label: 'Categoría',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '8rem',
      align: 'left',
    },
    {
      key: 'statusLabel',
      label: 'Estado',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '7rem',
      align: 'left',
    },
    {
      key: 'sizeLabel',
      label: 'Tamaño',
      type: 'text',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (_value, row) => formatFileSize(row.size),
    },
    {
      key: 'relationLabel',
      label: 'Relación',
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
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '9rem',
      align: 'left',
      formatter: (value) => formatDateTime(String(value)),
    },
  ]);

  readonly rowActions = computed<readonly TableAction<ManagedFileListItem>[]>(() => [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    { id: 'download', label: 'Descargar', icon: 'download', variant: 'default' },
    { id: 'edit', label: 'Editar metadata', icon: 'edit', variant: 'default' },
    {
      id: 'archive',
      label: 'Archivar',
      icon: 'archive',
      variant: 'default',
      hidden: (row) => row.status === 'archived',
    },
    {
      id: 'restore',
      label: 'Restaurar',
      icon: 'unarchive',
      variant: 'default',
      hidden: (row) => row.status !== 'archived',
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      variant: 'danger',
      confirmationRequired: true,
      confirmationMessage: '¿Eliminar este archivo del listado?',
    },
  ]);

  ngOnInit(): void {
    this.store.loadFiles();
  }

  upload(): void {
    void this.router.navigate(['/archivos/subir']);
  }

  importData(): void {
    void this.router.navigate(['/archivos/importar']);
  }

  refresh(): void {
    this.store.loadFiles();
  }

  exportMetadata(): void {
    this.store.exportMetadata();
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  applySearch(search: string): void {
    this.store.applySearch(search);
  }

  updateFilter(key: keyof FileFilters, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.applyFilters({ ...this.filters(), [key]: value } as FileFilters);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  openFile(file: ManagedFileListItem): void {
    void this.router.navigate(['/archivos', file.id]);
  }

  onAction(event: TableActionClick<ManagedFileListItem>): void {
    switch (event.action.id) {
      case 'view':
        this.openFile(event.row);
        break;
      case 'download':
        this.store.openDownload(event.row.id);
        break;
      case 'edit':
        void this.router.navigate(['/archivos', event.row.id, 'editar']);
        break;
      case 'archive':
        this.store.archive(event.row.id);
        break;
      case 'restore':
        this.store.restore(event.row.id);
        break;
      case 'delete':
        this.store.delete(event.row.id);
        break;
    }
  }

  readonly formatNumber = formatNumber;
  readonly formatFileSize = formatFileSize;
  readonly formatDateTime = formatDateTime;
}
