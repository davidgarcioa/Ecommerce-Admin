import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-table-toolbar',
  templateUrl: './table-toolbar.html',
  styleUrl: './table-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableToolbarComponent {
  readonly searchable = input(true);
  readonly searchTerm = input('');
  readonly filterEnabled = input(false);
  readonly filterPanelVisible = input(false);
  readonly activeFilterCount = input(0);
  readonly exportEnabled = input(false);
  readonly columnSelectorEnabled = input(false);
  readonly totalResults = input.required<number>();
  readonly selectedCount = input(0);

  readonly searchChange = output<string>();
  readonly clearSearch = output<void>();
  readonly toggleFilters = output<void>();
  readonly exportTable = output<void>();
  readonly toggleColumnSelector = output<void>();

  private debounceId: number | null = null;
  readonly localSearchTerm = signal('');
  readonly resultText = computed(() => `${this.totalResults()} registros`);

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.localSearchTerm.set(value);

    if (this.debounceId !== null) {
      window.clearTimeout(this.debounceId);
    }

    this.debounceId = window.setTimeout(() => {
      this.searchChange.emit(value);
    }, 300);
  }

  onClearSearch(): void {
    this.localSearchTerm.set('');
    this.clearSearch.emit();
  }
}
