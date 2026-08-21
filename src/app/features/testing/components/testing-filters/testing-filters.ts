import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';

import { TestingFilters } from '../../data-access/testing.models';
import {
  DEFAULT_TESTING_FILTERS,
  TESTING_ASSOCIATION_OPTIONS,
  TESTING_STATUS_OPTIONS,
  TESTING_TYPE_OPTIONS,
} from '../../utils/testing.constants';

type TestingSelectKey = 'status' | 'type' | 'associationType';

@Component({
  selector: 'app-testing-filters',
  templateUrl: './testing-filters.html',
  styleUrl: './testing-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeSelects()',
    '(keydown.escape)': 'closeSelects()',
  },
})
export class TestingFiltersComponent implements OnChanges {
  readonly filters = input<TestingFilters>(DEFAULT_TESTING_FILTERS);
  readonly applyFilters = output<TestingFilters>();
  readonly clear = output<void>();

  readonly statusOptions = TESTING_STATUS_OPTIONS;
  readonly typeOptions = TESTING_TYPE_OPTIONS;
  readonly associationOptions = TESTING_ASSOCIATION_OPTIONS;
  readonly current = signal<TestingFilters>(DEFAULT_TESTING_FILTERS);
  readonly openSelect = signal<TestingSelectKey | null>(null);
  readonly activeFiltersCount = computed(() => {
    const filters = this.current();

    return (
      Number(filters.searchTerm.trim().length > 0) +
      Number(filters.status !== 'all') +
      Number(filters.type !== 'all') +
      Number(filters.associationType !== 'all')
    );
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) this.current.set(this.filters());
  }

  protected onSearchChange(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;

    this.current.update((filters) => ({ ...filters, searchTerm }));
  }

  protected toggleSelect(key: TestingSelectKey): void {
    this.openSelect.update((current) => (current === key ? null : key));
  }

  protected closeSelects(): void {
    this.openSelect.set(null);
  }

  protected isSelectOpen(key: TestingSelectKey): boolean {
    return this.openSelect() === key;
  }

  protected selectStatus(status: TestingFilters['status']): void {
    this.current.update((filters) => ({ ...filters, status }));
    this.closeSelects();
  }

  protected selectType(type: TestingFilters['type']): void {
    this.current.update((filters) => ({ ...filters, type }));
    this.closeSelects();
  }

  protected selectAssociation(associationType: TestingFilters['associationType']): void {
    this.current.update((filters) => ({ ...filters, associationType }));
    this.closeSelects();
  }

  protected selectedStatusLabel(): string {
    return (
      this.statusOptions.find((option) => option.value === this.current().status)?.label ?? 'Todos'
    );
  }

  protected selectedTypeLabel(): string {
    return (
      this.typeOptions.find((option) => option.value === this.current().type)?.label ?? 'Todos'
    );
  }

  protected selectedAssociationLabel(): string {
    return (
      this.associationOptions.find((option) => option.value === this.current().associationType)
        ?.label ?? 'Todas'
    );
  }

  protected onApply(): void {
    this.applyFilters.emit(this.current());
  }

  protected onClear(): void {
    this.current.set(DEFAULT_TESTING_FILTERS);
    this.clear.emit();
  }
}
