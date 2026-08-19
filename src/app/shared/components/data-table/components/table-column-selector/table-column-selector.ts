import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TableColumn } from '../../models/table-column.model';

@Component({
  selector: 'app-table-column-selector',
  templateUrl: './table-column-selector.html',
  styleUrl: './table-column-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableColumnSelectorComponent<T extends object> {
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly visibleColumnKeys = input.required<readonly Extract<keyof T, string>[]>();

  readonly visibleColumnKeysChange = output<readonly Extract<keyof T, string>[]>();
  readonly visibleColumnsCount = computed(() => this.visibleColumnKeys().length);
  readonly totalColumnsCount = computed(() => this.columns().length);

  isColumnVisible(key: Extract<keyof T, string>): boolean {
    return this.visibleColumnKeys().includes(key);
  }

  onToggleColumn(key: Extract<keyof T, string>, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const keys = this.visibleColumnKeys();

    if (!checked && keys.length === 1 && keys.includes(key)) {
      (event.target as HTMLInputElement).checked = true;
      return;
    }

    const nextKeys = checked ? [...keys, key] : keys.filter((item) => item !== key);

    this.visibleColumnKeysChange.emit(nextKeys);
  }
}
