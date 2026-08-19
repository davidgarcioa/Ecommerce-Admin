import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { TableAction, TableActionClick } from '../../models/table-action.model';

@Component({
  selector: 'app-table-row-actions',
  templateUrl: './table-row-actions.html',
  styleUrl: './table-row-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowActionsComponent<T extends object> {
  readonly row = input.required<T>();
  readonly actions = input<readonly TableAction<T>[]>([]);

  readonly actionClick = output<TableActionClick<T>>();

  readonly menuOpen = signal(false);
  readonly pendingAction = signal<TableAction<T> | null>(null);

  readonly visibleActions = computed(() =>
    this.actions().filter((action) => !this.resolveActionState(action.hidden)),
  );

  onToggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  onAction(action: TableAction<T>): void {
    if (this.resolveActionState(action.disabled)) {
      return;
    }

    if (action.confirmationRequired) {
      this.pendingAction.set(action);
      return;
    }

    this.actionClick.emit({ action, row: this.row() });
    this.menuOpen.set(false);
  }

  onConfirmAction(): void {
    const action = this.pendingAction();

    if (!action) {
      return;
    }

    this.actionClick.emit({ action, row: this.row() });
    this.pendingAction.set(null);
    this.menuOpen.set(false);
  }

  onCancelAction(): void {
    this.pendingAction.set(null);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.menuOpen.set(false);
      this.pendingAction.set(null);
    }
  }

  isDisabled(action: TableAction<T>): boolean {
    return this.resolveActionState(action.disabled);
  }

  private resolveActionState(value: boolean | ((row: T) => boolean) | undefined): boolean {
    if (typeof value === 'function') {
      return value(this.row());
    }

    return value ?? false;
  }
}
