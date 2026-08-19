import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { formatExpenseDate } from '../../utils/expenses.formatters';

@Component({
  selector: 'app-expenses-header',
  templateUrl: './expenses-header.html',
  styleUrl: './expenses-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesHeaderComponent {
  readonly loading = input(false);
  readonly lastUpdated = input<string | null>(null);
  readonly create = output<void>();
  readonly refresh = output<void>();

  protected formatLastUpdated(value: string | null): string {
    return value ? formatExpenseDate(value.slice(0, 10)) : 'Sin sincronizar';
  }
}
