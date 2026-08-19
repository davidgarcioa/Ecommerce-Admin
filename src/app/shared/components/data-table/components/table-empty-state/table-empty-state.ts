import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-table-empty-state',
  templateUrl: './table-empty-state.html',
  styleUrl: './table-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableEmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionLabel = input<string | null>(null);
  readonly action = output<void>();
}
