import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { ProductAdPerformance } from '../../models/product-ad-performance.model';
import { formatCampaignValue } from '../../utils/campaigns.utils';

@Component({
  selector: 'app-product-performance-table',
  imports: [DataTableComponent],
  templateUrl: './product-performance-table.html',
  styleUrl: './product-performance-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPerformanceTableComponent {
  readonly products = input.required<readonly ProductAdPerformance[]>();
  readonly loading = input(false);
  readonly columns: readonly TableColumn<ProductAdPerformance>[] = [
    this.column('productName', 'Producto'),
    this.column('productGroupName', 'Conjunto'),
    this.number('activeCampaigns', 'Campañas activas'),
    this.money('amountSpent', 'Inversión'),
    this.money('attributedRevenue', 'Ventas'),
    this.number('purchases', 'Compras'),
    this.money('cpa', 'CPA'),
    this.multiplier('roas', 'ROAS'),
    this.percent('ctr', 'CTR'),
    this.percent('returnRate', 'Tasa devolución'),
    this.money('estimatedProfit', 'Ganancia estimada'),
  ];

  private column(
    key: keyof ProductAdPerformance & string,
    label: string,
    type: TableColumn<ProductAdPerformance>['type'] = 'text',
  ): TableColumn<ProductAdPerformance> {
    return {
      key,
      label,
      type,
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '11rem',
      align: 'left',
    };
  }

  private money(
    key: keyof ProductAdPerformance & string,
    label: string,
  ): TableColumn<ProductAdPerformance> {
    return {
      ...this.column(key, label, 'currency'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'currency'),
    };
  }

  private number(
    key: keyof ProductAdPerformance & string,
    label: string,
  ): TableColumn<ProductAdPerformance> {
    return {
      ...this.column(key, label, 'number'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'number'),
    };
  }

  private percent(
    key: keyof ProductAdPerformance & string,
    label: string,
  ): TableColumn<ProductAdPerformance> {
    return {
      ...this.column(key, label, 'percentage'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'percentage'),
    };
  }

  private multiplier(
    key: keyof ProductAdPerformance & string,
    label: string,
  ): TableColumn<ProductAdPerformance> {
    return {
      ...this.column(key, label, 'number'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'multiplier'),
    };
  }
}
