import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LayoutStateService } from '../../../../core/services/layout-state.service';
import { TableActionClick } from '../../../../shared/components/data-table/models/table-action.model';
import { DailyOrderDetailComponent } from '../../components/daily-order-detail/daily-order-detail';
import { DailyOrdersSectionComponent } from '../../components/daily-orders-section/daily-orders-section';
import { DailySummaryGridComponent } from '../../components/daily-summary-grid/daily-summary-grid';
import { DashboardVisualSummaryComponent } from '../../components/dashboard-visual-summary/dashboard-visual-summary';
import { OperationalStatusSummaryComponent } from '../../components/operational-status-summary/operational-status-summary';
import { PerformanceComparisonComponent } from '../../components/performance-comparison/performance-comparison';
import { ProductGroupPerformanceComponent } from '../../components/product-group-performance/product-group-performance';
import { ReportErrorStateComponent } from '../../components/report-error-state/report-error-state';
import { ReportExportPanelComponent } from '../../components/report-export-panel/report-export-panel';
import { DailyOrder, OrderStatus } from '../../models/daily-order.model';
import { ReportExportOptions } from '../../models/daily-report.model';
import { DailyReportService } from '../../services/daily-report.service';

@Component({
  selector: 'app-daily-report-page',
  imports: [
    DashboardVisualSummaryComponent,
    DailySummaryGridComponent,
    PerformanceComparisonComponent,
    ProductGroupPerformanceComponent,
    OperationalStatusSummaryComponent,
    DailyOrdersSectionComponent,
    DailyOrderDetailComponent,
    ReportExportPanelComponent,
    ReportErrorStateComponent,
  ],
  templateUrl: './daily-report-page.html',
  styleUrl: './daily-report-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyReportPageComponent implements OnInit {
  private readonly dailyReportService = inject(DailyReportService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly layoutState = inject(LayoutStateService);
  private readonly router = inject(Router);

  readonly report = this.dailyReportService.report;
  readonly summaryMetrics = this.dailyReportService.summaryMetrics;
  readonly comparison = this.dailyReportService.comparison;
  readonly productGroupPerformance = this.dailyReportService.productGroupPerformance;
  readonly operationalStatus = this.dailyReportService.operationalStatus;
  readonly filteredOrders = this.dailyReportService.filteredOrders;
  readonly filters = this.dailyReportService.filters;
  readonly loading = this.dailyReportService.loading;
  readonly error = this.dailyReportService.error;
  readonly comparisonEnabled = this.dailyReportService.comparisonEnabled;
  readonly exportPanelVisible = this.dailyReportService.exportPanelVisible;
  readonly selectedOrder = this.dailyReportService.selectedOrder;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter((event) => event.urlAfterRedirects === '/dashboard'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.activateDashboardView());
  }

  ngOnInit(): void {
    this.activateDashboardView();
    this.dailyReportService.loadReport();
  }

  onOpenExportPanel(): void {
    this.dailyReportService.openExportPanel();
  }

  onCloseExportPanel(): void {
    this.dailyReportService.closeExportPanel();
  }

  onRetryReport(): void {
    this.dailyReportService.loadReport();
  }

  onSelectOrder(order: DailyOrder): void {
    this.dailyReportService.selectOrder(order);
  }

  onCloseOrderDetail(): void {
    this.dailyReportService.closeOrderDetail();
  }

  onOrderAction(event: TableActionClick<DailyOrder>): void {
    switch (event.action.id) {
      case 'view':
        this.dailyReportService.selectOrder(event.row);
        break;
      case 'edit-status':
        this.dailyReportService.updateOrderStatus(event.row.id, 'En tránsito');
        break;
      case 'urgent':
        this.dailyReportService.toggleUrgent(event.row.id);
        break;
      case 'duplicate':
      case 'export':
        this.dailyReportService.selectOrder(event.row);
        break;
      case 'cancel':
        this.dailyReportService.cancelOrder(event.row.id);
        break;
    }
  }

  onUpdateSelectedOrderStatus(status: OrderStatus): void {
    const order = this.selectedOrder();
    if (order) {
      this.dailyReportService.updateOrderStatus(order.id, status);
    }
  }

  onToggleSelectedOrderUrgent(): void {
    const order = this.selectedOrder();
    if (order) {
      this.dailyReportService.toggleUrgent(order.id);
    }
  }

  onExport(options: ReportExportOptions): void {
    const content = this.dailyReportService.exportReport(options);
    const blob = new Blob([content], {
      type: options.format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `informe-diario-${this.filters().date}.${options.format}`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.dailyReportService.closeExportPanel();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, left: 0 });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    window.requestAnimationFrame(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  private activateDashboardView(): void {
    this.layoutState.setCurrentUrl('/dashboard');
    this.dailyReportService.activateDashboardReport();
    this.scrollToTop();
  }
}
