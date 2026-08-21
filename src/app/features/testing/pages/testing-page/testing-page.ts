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
import { TestingFiltersComponent } from '../../components/testing-filters/testing-filters';
import { TestingHeaderComponent } from '../../components/testing-header/testing-header';
import { TestingSummaryComponent } from '../../components/testing-summary/testing-summary';
import {
  TestingFilters,
  TestingListItem,
  TestingSortOption,
} from '../../data-access/testing.models';
import { TestingStore } from '../../data-access/testing.store';
import { TESTING_TABLE_PREFERENCES_KEY } from '../../utils/testing.constants';
import { formatTestingDate } from '../../utils/testing.formatters';

@Component({
  selector: 'app-testing-page',
  imports: [
    TestingHeaderComponent,
    TestingSummaryComponent,
    TestingFiltersComponent,
    DataTableComponent,
  ],
  providers: [TestingStore],
  templateUrl: './testing-page.html',
  styleUrl: './testing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingPageComponent implements OnInit {
  private readonly store = inject(TestingStore);
  private readonly router = inject(Router);

  readonly tests = this.store.filteredTests;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly filters = this.store.filters;
  readonly lastUpdated = this.store.lastUpdated;
  readonly canCreate = this.store.canCreate;
  readonly total = this.store.total;
  readonly active = this.store.active;
  readonly completed = this.store.completed;
  readonly archived = this.store.archived;
  readonly draft = this.store.draft;
  readonly paused = this.store.paused;
  readonly preferencesKey = TESTING_TABLE_PREFERENCES_KEY;
  readonly filtersVisible = signal(false);
  readonly activeFiltersCount = computed(() => {
    const filters = this.filters();

    return (
      Number(filters.searchTerm.trim().length > 0) +
      Number(filters.status !== 'all') +
      Number(filters.type !== 'all') +
      Number(filters.associationType !== 'all')
    );
  });

  readonly columns = computed<readonly TableColumn<TestingListItem>[]>(() => [
    {
      key: 'name',
      label: 'Testeo',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '13rem',
      align: 'left',
    },
    {
      key: 'code',
      label: 'Codigo',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '7rem',
      align: 'left',
    },
    {
      key: 'typeLabel',
      label: 'Tipo',
      type: 'status',
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
      minWidth: '8rem',
      align: 'left',
    },
    {
      key: 'objective',
      label: 'Objetivo',
      type: 'text',
      sortable: false,
      searchable: true,
      visible: true,
      minWidth: '16rem',
      align: 'left',
    },
    {
      key: 'associationLabel',
      label: 'Asociacion',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '12rem',
      align: 'left',
    },
    {
      key: 'startDate',
      label: 'Inicio',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '8rem',
      align: 'left',
      formatter: (value) => formatTestingDate(String(value)),
    },
    {
      key: 'owner',
      label: 'Responsable',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '10rem',
      align: 'left',
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
      formatter: (value) => formatTestingDate(String(value)),
    },
  ]);

  readonly rowActions = computed<readonly TableAction<TestingListItem>[]>(() => [
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
      confirmationMessage: 'Eliminar este testeo de forma definitiva?',
    },
  ]);

  ngOnInit(): void {
    this.store.loadTests();
  }

  create(): void {
    void this.router.navigate(['/testeos/nuevo']);
  }

  refresh(): void {
    this.store.loadTests();
  }

  toggleFilters(): void {
    this.filtersVisible.update((visible) => !visible);
  }

  applySearch(search: string): void {
    this.store.applySearch(search);
  }

  applyFilters(filters: TestingFilters): void {
    this.store.applyFilters(filters);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  setSort(sort: TestingSortOption): void {
    this.store.setSort(sort);
  }

  openTest(test: TestingListItem): void {
    void this.router.navigate(['/testeos', test.id]);
  }

  onAction(event: TableActionClick<TestingListItem>): void {
    if (event.action.id === 'view') this.openTest(event.row);
    if (event.action.id === 'edit') void this.router.navigate(['/testeos', event.row.id, 'editar']);
    if (event.action.id === 'archive') this.store.archive(event.row.id);
    if (event.action.id === 'restore') this.store.restore(event.row.id);
    if (event.action.id === 'delete') this.store.delete(event.row.id);
  }
}
