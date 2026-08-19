import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { TableActionClick } from '../../../../shared/components/data-table/models/table-action.model';
import { AdPerformanceTableComponent } from '../../components/ad-performance-table/ad-performance-table';
import { AdsetPerformanceTableComponent } from '../../components/adset-performance-table/adset-performance-table';
import { AdvertisingSummaryGridComponent } from '../../components/advertising-summary-grid/advertising-summary-grid';
import { CampaignDetailDrawerComponent } from '../../components/campaign-detail-drawer/campaign-detail-drawer';
import { CampaignFormComponent } from '../../components/campaign-form/campaign-form';
import { CampaignPerformanceTableComponent } from '../../components/campaign-performance-table/campaign-performance-table';
import { CampaignStatusSummaryComponent } from '../../components/campaign-status-summary/campaign-status-summary';
import { CampaignsEmptyStateComponent } from '../../components/campaigns-empty-state/campaigns-empty-state';
import { CampaignsErrorStateComponent } from '../../components/campaigns-error-state/campaigns-error-state';
import { CampaignsFiltersComponent } from '../../components/campaigns-filters/campaigns-filters';
import { CampaignsHeaderComponent } from '../../components/campaigns-header/campaigns-header';
import { ProductPerformanceTableComponent } from '../../components/product-performance-table/product-performance-table';
import { SynchronizationHistoryComponent } from '../../components/synchronization-history/synchronization-history';
import { Campaign, CampaignFormData } from '../../models/campaign.model';
import { CampaignFilter } from '../../models/campaign-filter.model';
import { CampaignsService } from '../../services/campaigns.service';

type CampaignPerformanceView = 'campaigns' | 'products' | 'adSets' | 'ads' | 'history';

@Component({
  selector: 'app-campaigns-page',
  imports: [
    CampaignsHeaderComponent,
    CampaignsFiltersComponent,
    AdvertisingSummaryGridComponent,
    CampaignStatusSummaryComponent,
    CampaignPerformanceTableComponent,
    ProductPerformanceTableComponent,
    AdsetPerformanceTableComponent,
    AdPerformanceTableComponent,
    SynchronizationHistoryComponent,
    CampaignDetailDrawerComponent,
    CampaignFormComponent,
    CampaignsEmptyStateComponent,
    CampaignsErrorStateComponent,
  ],
  templateUrl: './campaigns-page.html',
  styleUrl: './campaigns-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsPageComponent {
  private readonly campaignsService = inject(CampaignsService);

  readonly report = this.campaignsService.report;
  readonly summaryMetrics = this.campaignsService.summaryMetrics;
  readonly campaigns = this.campaignsService.filteredCampaigns;
  readonly adSets = this.campaignsService.filteredAdSets;
  readonly advertisements = this.campaignsService.filteredAdvertisements;
  readonly productPerformance = this.campaignsService.productPerformance;
  readonly statusSummary = this.campaignsService.statusSummary;
  readonly filters = this.campaignsService.filters;
  readonly loading = this.campaignsService.loading;
  readonly error = this.campaignsService.error;
  readonly selectedCampaign = this.campaignsService.selectedCampaign;
  readonly campaignFormVisible = this.campaignsService.campaignFormVisible;
  readonly campaignFormMode = this.campaignsService.campaignFormMode;
  readonly synchronizationHistory = this.campaignsService.synchronizationHistory;
  readonly lastSynchronization = this.campaignsService.lastSynchronization;
  readonly toastMessage = this.campaignsService.toastMessage;
  readonly filtersVisible = signal(false);
  readonly performanceView = signal<CampaignPerformanceView>('campaigns');

  onApplyFilters(filters: CampaignFilter): void {
    this.campaignsService.applyFilters(filters);
    this.filtersVisible.set(false);
  }

  onClearFilters(): void {
    this.campaignsService.clearFilters();
  }

  toggleFilters(): void {
    this.filtersVisible.update((visible) => !visible);
  }

  setPerformanceView(view: CampaignPerformanceView): void {
    this.performanceView.set(view);
  }

  onSelectCampaign(campaign: Campaign): void {
    this.campaignsService.selectCampaign(campaign);
  }

  onCampaignAction(event: TableActionClick<Campaign>): void {
    switch (event.action.id) {
      case 'view':
        this.campaignsService.selectCampaign(event.row);
        break;
      case 'edit':
        this.campaignsService.openEditCampaign(event.row);
        break;
      case 'duplicate':
        this.campaignsService.openDuplicateCampaign(event.row);
        break;
      case 'pause':
        this.campaignsService.pauseCampaign(event.row.id);
        break;
      case 'activate':
        this.campaignsService.activateCampaign(event.row.id);
        break;
      case 'archive':
        this.campaignsService.archiveCampaign(event.row.id);
        break;
      case 'delete':
        this.campaignsService.deleteCampaign(event.row.id);
        break;
      case 'export':
        this.campaignsService.selectCampaign(event.row);
        break;
    }
  }

  onToggleCampaignStatus(campaign: Campaign): void {
    if (campaign.status === 'Activa') {
      this.campaignsService.pauseCampaign(campaign.id);
    } else {
      this.campaignsService.activateCampaign(campaign.id);
    }
  }

  onSaveCampaign(data: CampaignFormData): void {
    this.campaignsService.saveCampaign(data);
  }

  synchronize(): void {
    this.campaignsService.synchronizeCampaigns();
  }

  openCreate(): void {
    this.campaignsService.openCreateCampaign();
  }

  closeDetail(): void {
    this.campaignsService.closeCampaignDetail();
  }

  closeForm(): void {
    this.campaignsService.closeCampaignForm();
  }

  retry(): void {
    this.campaignsService.loadCampaigns();
  }

  editCampaign(campaign: Campaign): void {
    this.campaignsService.openEditCampaign(campaign);
  }

  duplicateCampaign(campaign: Campaign): void {
    this.campaignsService.openDuplicateCampaign(campaign);
  }

  archiveCampaign(id: string): void {
    this.campaignsService.archiveCampaign(id);
  }
}
