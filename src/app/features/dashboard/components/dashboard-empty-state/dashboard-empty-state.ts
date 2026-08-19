import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-dashboard-empty-state',
  templateUrl: './dashboard-empty-state.html',
  styleUrl: './dashboard-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardEmptyStateComponent {
  readonly message = input.required<string>();
  readonly clearFilters = output<void>();
}
