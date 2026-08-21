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
import { LabelsFiltersComponent } from '../../components/labels-filters/labels-filters';
import { LabelsHeaderComponent } from '../../components/labels-header/labels-header';
import { LabelsSummaryComponent } from '../../components/labels-summary/labels-summary';
import { TagFilters, TagListItem, TagSortOption } from '../../data-access/tags.models';
import { TagsStore } from '../../data-access/tags.store';
import { TAGS_TABLE_PREFERENCES_KEY } from '../../utils/tags.constants';
import { formatTagDate } from '../../utils/tags.formatters';

@Component({
  selector: 'app-labels-page',
  imports: [
    LabelsHeaderComponent,
    LabelsSummaryComponent,
    LabelsFiltersComponent,
    DataTableComponent,
  ],
  providers: [TagsStore],
  templateUrl: './labels-page.html',
  styleUrl: './labels-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsPageComponent implements OnInit {
  private readonly store = inject(TagsStore);
  private readonly router = inject(Router);

  readonly tags = this.store.filteredTags;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly filters = this.store.filters;
  readonly lastUpdated = this.store.lastUpdated;
  readonly totalTags = this.store.totalTags;
  readonly activeTags = this.store.activeTags;
  readonly archivedTags = this.store.archivedTags;
  readonly usedTags = this.store.usedTags;
  readonly unusedTags = this.store.unusedTags;
  readonly totalAssociations = this.store.totalAssociations;
  readonly canCreate = this.store.canCreate;
  readonly preferencesKey = TAGS_TABLE_PREFERENCES_KEY;
  readonly filtersVisible = signal(false);
  readonly activeFiltersCount = computed(() => {
    const filters = this.filters();

    return (
      Number(filters.searchTerm.trim().length > 0) +
      Number(filters.status !== 'all') +
      Number(filters.usage !== 'all') +
      Number(filters.color !== 'all')
    );
  });

  readonly columns = computed<readonly TableColumn<TagListItem>[]>(() => [
    {
      key: 'name',
      label: 'Etiqueta',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '12rem',
      align: 'left',
    },
    {
      key: 'code',
      label: 'Codigo',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '8rem',
      align: 'left',
    },
    {
      key: 'color',
      label: 'Color',
      type: 'color',
      sortable: false,
      searchable: true,
      visible: true,
      minWidth: '7rem',
      align: 'left',
    },
    {
      key: 'description',
      label: 'Descripcion',
      type: 'text',
      sortable: false,
      searchable: true,
      visible: true,
      minWidth: '14rem',
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
      key: 'usageCount',
      label: 'Usos',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '6rem',
      align: 'right',
    },
    {
      key: 'activeLabel',
      label: 'Activa',
      type: 'boolean',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '6rem',
      align: 'center',
    },
    {
      key: 'updatedAt',
      label: 'Actualizacion',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '8rem',
      align: 'left',
      formatter: (value) => formatTagDate(String(value)),
    },
  ]);

  readonly rowActions = computed<readonly TableAction<TagListItem>[]>(() => [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    { id: 'edit', label: 'Editar', icon: 'edit', variant: 'default' },
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
      confirmationMessage: 'Eliminar esta etiqueta de forma definitiva?',
    },
  ]);

  ngOnInit(): void {
    this.store.loadTags();
  }

  create(): void {
    void this.router.navigate(['/etiquetas/nueva']);
  }

  refresh(): void {
    this.store.loadTags();
  }

  toggleFilters(): void {
    this.filtersVisible.update((visible) => !visible);
  }

  applySearch(search: string): void {
    this.store.applySearch(search);
  }

  applyFilters(filters: TagFilters): void {
    this.store.applyFilters(filters);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  setSort(sort: TagSortOption): void {
    this.store.setSort(sort);
  }

  openTag(tag: TagListItem): void {
    void this.router.navigate(['/etiquetas', tag.id]);
  }

  onAction(event: TableActionClick<TagListItem>): void {
    if (event.action.id === 'view') this.openTag(event.row);
    if (event.action.id === 'edit')
      void this.router.navigate(['/etiquetas', event.row.id, 'editar']);
    if (event.action.id === 'archive') this.store.archive(event.row.id);
    if (event.action.id === 'restore') this.store.restore(event.row.id);
    if (event.action.id === 'delete') this.store.delete(event.row.id);
  }
}
