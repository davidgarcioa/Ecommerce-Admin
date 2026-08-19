import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-dashboard-error-state',
  templateUrl: './dashboard-error-state.html',
  styleUrl: './dashboard-error-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardErrorStateComponent {
  readonly message = input.required<string>();
  readonly retry = output<void>();
}
