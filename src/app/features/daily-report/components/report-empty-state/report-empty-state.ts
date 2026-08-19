import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-report-empty-state',
  templateUrl: './report-empty-state.html',
  styleUrl: './report-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportEmptyStateComponent {
  readonly clear = output<void>();
}
