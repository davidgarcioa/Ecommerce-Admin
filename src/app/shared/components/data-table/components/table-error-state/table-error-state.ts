import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-table-error-state',
  templateUrl: './table-error-state.html',
  styleUrl: './table-error-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableErrorStateComponent {
  readonly message = input.required<string>();
  readonly retry = output<void>();
}
