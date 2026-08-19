import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { Campaign } from '../../models/campaign.model';
import { formatCampaignValue } from '../../utils/campaigns.utils';

@Component({
  selector: 'app-campaign-performance-table',
  imports: [DataTableComponent],
  templateUrl: './campaign-performance-table.html',
  styleUrl: './campaign-performance-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignPerformanceTableComponent {
  readonly campaigns = input.required<readonly Campaign[]>();
  readonly loading = input(false);
  readonly rowClick = output<Campaign>();
  readonly actionClick = output<TableActionClick<Campaign>>();

  readonly columns: readonly TableColumn<Campaign>[] = [
    this.column('name', 'Campaña', 'text', '18rem'),
    this.column('status', 'Estado', 'status'),
    this.column('objective', 'Objetivo', 'text'),
    this.column('adAccountName', 'Cuenta', 'text', '14rem'),
    this.column('productGroupName', 'Conjunto', 'text'),
    this.column('platform', 'Plataforma', 'text'),
    this.column('budgetType', 'Presupuesto', 'text'),
    this.moneyColumn('amountSpent', 'Inversión'),
    this.moneyColumn('attributedRevenue', 'Ventas atribuidas'),
    this.numberColumn('purchases', 'Compras'),
    this.moneyColumn('cpa', 'CPA'),
    this.multiplierColumn('roas', 'ROAS'),
    this.percentColumn('ctr', 'CTR'),
    this.moneyColumn('cpc', 'CPC'),
    this.moneyColumn('cpm', 'CPM'),
    this.numberColumn('impressions', 'Impresiones'),
    this.numberColumn('reach', 'Alcance'),
    this.dateColumn('startDate', 'Inicio'),
    this.dateColumn('lastSynchronizedAt', 'Última sincronización'),
    {
      ...this.column('hasWarnings', 'Alertas', 'boolean'),
      formatter: (value, row) => (value ? (row.warningMessage ?? 'Con alerta') : 'Sin alertas'),
    },
  ];

  readonly actions: readonly TableAction<Campaign>[] = [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    { id: 'edit', label: 'Editar', icon: 'edit', variant: 'default' },
    { id: 'duplicate', label: 'Duplicar', icon: 'content_copy', variant: 'default' },
    {
      id: 'pause',
      label: 'Pausar',
      icon: 'pause',
      variant: 'default',
      hidden: (row) => row.status !== 'Activa',
    },
    {
      id: 'activate',
      label: 'Activar',
      icon: 'play_arrow',
      variant: 'default',
      hidden: (row) => row.status === 'Activa',
    },
    { id: 'archive', label: 'Archivar', icon: 'archive', variant: 'default' },
    { id: 'export', label: 'Exportar', icon: 'download', variant: 'default' },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      variant: 'danger',
      confirmationRequired: true,
      confirmationMessage: 'Eliminar esta campana?',
    },
  ];

  private column(
    key: keyof Campaign & string,
    label: string,
    type: TableColumn<Campaign>['type'],
    minWidth = '10rem',
  ): TableColumn<Campaign> {
    return {
      key,
      label,
      type,
      sortable: true,
      searchable: true,
      visible: true,
      minWidth,
      align: 'left',
    };
  }

  private moneyColumn(key: keyof Campaign & string, label: string): TableColumn<Campaign> {
    return {
      ...this.column(key, label, 'currency'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'currency'),
    };
  }

  private numberColumn(key: keyof Campaign & string, label: string): TableColumn<Campaign> {
    return {
      ...this.column(key, label, 'number'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'number'),
    };
  }

  private percentColumn(key: keyof Campaign & string, label: string): TableColumn<Campaign> {
    return {
      ...this.column(key, label, 'percentage'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'percentage'),
    };
  }

  private multiplierColumn(key: keyof Campaign & string, label: string): TableColumn<Campaign> {
    return {
      ...this.column(key, label, 'number'),
      align: 'right',
      formatter: (value) => formatCampaignValue(Number(value), 'multiplier'),
    };
  }

  private dateColumn(key: keyof Campaign & string, label: string): TableColumn<Campaign> {
    return { ...this.column(key, label, 'date'), searchable: false };
  }
}

