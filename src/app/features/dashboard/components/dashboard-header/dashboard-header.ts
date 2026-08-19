import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  readonly loading = input.required<boolean>();
  readonly filterPanelVisible = input.required<boolean>();

  readonly refreshDashboard = output<void>();
  readonly toggleFilters = output<void>();

  onRefreshDashboard(): void {
    this.refreshDashboard.emit();
  }

  onToggleFilters(): void {
    this.toggleFilters.emit();
  }
}
