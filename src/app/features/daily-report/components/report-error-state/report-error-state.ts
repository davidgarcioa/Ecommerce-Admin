import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-report-error-state',
  templateUrl: './report-error-state.html',
  styleUrl: './report-error-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportErrorStateComponent {
  readonly message = input.required<string>();
  readonly retry = output<void>();
}
