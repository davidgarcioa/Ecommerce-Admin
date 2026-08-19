import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { AdSet } from '../../models/ad-set.model';
import { formatCampaignValue } from '../../utils/campaigns.utils';

@Component({
  selector: 'app-adset-performance-table',
  imports: [DataTableComponent],
  templateUrl: './adset-performance-table.html',
  styleUrl: './adset-performance-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsetPerformanceTableComponent {
  readonly adSets = input.required<readonly AdSet[]>();
  readonly loading = input(false);
  readonly columns: readonly TableColumn<AdSet>[] = [
    this.column('name', 'Conjunto de anuncios'),
    this.column('campaignName', 'Campaña'),
    this.column('status', 'Estado', 'status'),
    this.column('optimizationGoal', 'Optimización'),
    this.money('dailyBudget', 'Presupuesto'),
    this.money('amountSpent', 'Inversión'),
    this.money('attributedRevenue', 'Ventas'),
    this.number('purchases', 'Compras'),
    this.money('cpa', 'CPA'),
    this.multiplier('roas', 'ROAS'),
    this.percent('ctr', 'CTR'),
    this.money('cpc', 'CPC'),
    this.number('reach', 'Alcance'),
  ];

  private column(
    key: keyof AdSet & string,
    label: string,
    type: TableColumn<AdSet>['type'] = 'text',
  ): TableColumn<AdSet> {
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

  private money(key: keyof AdSet & string, label: string): TableColumn<AdSet> {
    return {
      ...this.column(key, label, 'currency'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'currency'),
    };
  }

  private number(key: keyof AdSet & string, label: string): TableColumn<AdSet> {
    return {
      ...this.column(key, label, 'number'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'number'),
    };
  }

  private percent(key: keyof AdSet & string, label: string): TableColumn<AdSet> {
    return {
      ...this.column(key, label, 'percentage'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'percentage'),
    };
  }

  private multiplier(key: keyof AdSet & string, label: string): TableColumn<AdSet> {
    return {
      ...this.column(key, label, 'number'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'multiplier'),
    };
  }
}
