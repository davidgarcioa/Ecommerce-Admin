import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { ProductGroupsFiltersComponent } from '../../components/product-groups-filters/product-groups-filters';
import { ProductGroupsHeaderComponent } from '../../components/product-groups-header/product-groups-header';
import { ProductGroupSummaryComponent } from '../../components/product-group-summary/product-group-summary';
import {
  ProductGroupFilters,
  ProductGroupListItem,
  ProductGroupSortOption,
} from '../../data-access/product-groups.models';
import { ProductGroupsStore } from '../../data-access/product-groups.store';
import { PRODUCT_GROUPS_TABLE_PREFERENCES_KEY } from '../../utils/product-group.constants';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
} from '../../utils/product-group-formatters';

@Component({
  selector: 'app-product-groups-page',
  imports: [
    ProductGroupsHeaderComponent,
    ProductGroupSummaryComponent,
    ProductGroupsFiltersComponent,
    DataTableComponent,
  ],
  providers: [ProductGroupsStore],
  templateUrl: './product-groups-page.html',
  styleUrl: './product-groups-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupsPageComponent implements OnInit {
  private readonly store = inject(ProductGroupsStore);
  private readonly router = inject(Router);

  readonly groups = this.store.filteredGroups;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly filters = this.store.filters;
  readonly search = this.store.search;
  readonly sort = this.store.sort;
  readonly lastUpdated = this.store.lastUpdated;
  readonly canCreate = this.store.canCreate;
  readonly totalGroups = this.store.totalGroups;
  readonly activeGroups = this.store.activeGroups;
  readonly archivedGroups = this.store.archivedGroups;
  readonly totalAssociatedProducts = this.store.totalAssociatedProducts;
  readonly estimatedRevenue = this.store.estimatedRevenue;
  readonly estimatedProfit = this.store.estimatedProfit;
  readonly averageMargin = this.store.averageMargin;
  readonly preferencesKey = PRODUCT_GROUPS_TABLE_PREFERENCES_KEY;

  readonly columns = computed<readonly TableColumn<ProductGroupListItem>[]>(() => [
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '13rem',
      align: 'left',
    },
    {
      key: 'code',
      label: 'Código',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '7rem',
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
      key: 'productCount',
      label: 'Productos',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (value) => formatNumber(Number(value)),
    },
    {
      key: 'campaignCount',
      label: 'Campañas',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (value) => formatNumber(Number(value)),
    },
    {
      key: 'orderCount',
      label: 'Pedidos',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (value) => formatNumber(Number(value)),
    },
    {
      key: 'estimatedRevenue',
      label: 'Ingresos',
      type: 'currency',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '9rem',
      align: 'right',
      formatter: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'estimatedCost',
      label: 'Costos',
      type: 'currency',
      sortable: true,
      searchable: false,
      visible: false,
      minWidth: '9rem',
      align: 'right',
      formatter: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'estimatedProfit',
      label: 'Ganancia',
      type: 'currency',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '9rem',
      align: 'right',
      formatter: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'estimatedMargin',
      label: 'Margen',
      type: 'percentage',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (value) => formatPercentage(Number(value)),
    },
    {
      key: 'updatedAt',
      label: 'Actualización',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '8rem',
      align: 'left',
      formatter: (value) => formatDate(String(value)),
    },
  ]);

  readonly rowActions = computed<readonly TableAction<ProductGroupListItem>[]>(() => [
    {
      id: 'view',
      label: 'Ver detalle',
      icon: 'visibility',
      variant: 'default',
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: 'edit',
      variant: 'default',
      hidden: () => !this.store.canEdit(),
    },
    {
      id: 'products',
      label: 'Administrar productos',
      icon: 'inventory_2',
      variant: 'default',
      hidden: () => !this.store.canManageProducts(),
    },
    {
      id: 'archive',
      label: 'Archivar',
      icon: 'archive',
      variant: 'danger',
      hidden: (row) => row.status === 'archived' || !this.store.canArchive(),
      confirmationRequired: true,
      confirmationMessage: '¿Archivar este conjunto?',
    },
    {
      id: 'restore',
      label: 'Restaurar',
      icon: 'unarchive',
      variant: 'default',
      hidden: (row) => row.status !== 'archived' || !this.store.canArchive(),
    },
  ]);

  ngOnInit(): void {
    this.store.loadGroups();
  }

  create(): void {
    void this.router.navigate(['/conjuntos/nuevo']);
  }

  refresh(): void {
    this.store.loadGroups();
  }

  applySearch(search: string): void {
    this.store.applySearch(search);
  }

  applyFilters(filters: ProductGroupFilters): void {
    this.store.applyFilters(filters);
  }

  setSort(sort: ProductGroupSortOption): void {
    this.store.setSort(sort);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  openGroup(group: ProductGroupListItem): void {
    void this.router.navigate(['/conjuntos', group.id]);
  }

  onAction(event: TableActionClick<ProductGroupListItem>): void {
    switch (event.action.id) {
      case 'view':
        this.openGroup(event.row);
        break;
      case 'edit':
        void this.router.navigate(['/conjuntos', event.row.id, 'editar']);
        break;
      case 'products':
        void this.router.navigate(['/conjuntos', event.row.id, 'productos']);
        break;
      case 'archive':
        this.store.archive(event.row.id);
        break;
      case 'restore':
        this.store.restore(event.row.id);
        break;
    }
  }
}
