import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { Advertisement } from '../../models/advertisement.model';
import { formatCampaignValue } from '../../utils/campaigns.utils';

@Component({
  selector: 'app-ad-performance-table',
  imports: [DataTableComponent],
  templateUrl: './ad-performance-table.html',
  styleUrl: './ad-performance-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdPerformanceTableComponent {
  readonly advertisements = input.required<readonly Advertisement[]>();
  readonly loading = input(false);
  readonly columns: readonly TableColumn<Advertisement>[] = [
    this.column('name', 'Anuncio'),
    this.column('campaignName', 'Campaña'),
    this.column('adSetName', 'Conjunto'),
    this.column('format', 'Formato'),
    this.column('productName', 'Producto'),
    this.column('status', 'Estado', 'status'),
    this.money('amountSpent', 'Inversión'),
    this.money('attributedRevenue', 'Ventas'),
    this.number('purchases', 'Compras'),
    this.money('cpa', 'CPA'),
    this.multiplier('roas', 'ROAS'),
    this.percent('ctr', 'CTR'),
    this.money('cpc', 'CPC'),
    this.number('impressions', 'Impresiones'),
  ];

  private column(
    key: keyof Advertisement & string,
    label: string,
    type: TableColumn<Advertisement>['type'] = 'text',
  ): TableColumn<Advertisement> {
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

  private money(key: keyof Advertisement & string, label: string): TableColumn<Advertisement> {
    return {
      ...this.column(key, label, 'currency'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'currency'),
    };
  }

  private number(key: keyof Advertisement & string, label: string): TableColumn<Advertisement> {
    return {
      ...this.column(key, label, 'number'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'number'),
    };
  }

  private percent(key: keyof Advertisement & string, label: string): TableColumn<Advertisement> {
    return {
      ...this.column(key, label, 'percentage'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'percentage'),
    };
  }

  private multiplier(key: keyof Advertisement & string, label: string): TableColumn<Advertisement> {
    return {
      ...this.column(key, label, 'number'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'multiplier'),
    };
  }
}
