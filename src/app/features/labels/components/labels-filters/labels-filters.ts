import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';

import { TagFilters } from '../../data-access/tags.models';
import {
  DEFAULT_TAG_FILTERS,
  TAG_COLOR_OPTIONS,
  TAG_STATUS_OPTIONS,
  TAG_USAGE_OPTIONS,
} from '../../utils/tags.constants';

type LabelsFilterMenu = 'status' | 'usage' | 'color';

@Component({
  selector: 'app-labels-filters',
  templateUrl: './labels-filters.html',
  styleUrl: './labels-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsFiltersComponent {
  readonly filters = input.required<TagFilters>();
  readonly applyFilters = output<TagFilters>();
  readonly clear = output<void>();

  readonly statusOptions = TAG_STATUS_OPTIONS;
  readonly usageOptions = TAG_USAGE_OPTIONS;
  readonly colorOptions = TAG_COLOR_OPTIONS;
  readonly current = signal<TagFilters>(DEFAULT_TAG_FILTERS);
  readonly openMenu = signal<LabelsFilterMenu | null>(null);
  readonly activeFiltersCount = computed(
    () =>
      Number(this.current().searchTerm.trim().length > 0) +
      Number(this.current().status !== DEFAULT_TAG_FILTERS.status) +
      Number(this.current().usage !== DEFAULT_TAG_FILTERS.usage) +
      Number(this.current().color !== DEFAULT_TAG_FILTERS.color),
  );

  constructor() {
    effect(() => {
      this.current.set({ ...this.filters() });
    });
  }

  @HostListener('document:click')
  closeSelects(): void {
    this.openMenu.set(null);
  }

  @HostListener('document:keydown.escape')
  closeSelectsOnEscape(): void {
    this.closeSelects();
  }

  toggleSelect(menu: LabelsFilterMenu): void {
    this.openMenu.update((current) => (current === menu ? null : menu));
  }

  isSelectOpen(menu: LabelsFilterMenu): boolean {
    return this.openMenu() === menu;
  }

  selectedStatusLabel(): string {
    return (
      this.statusOptions.find((option) => option.value === this.current().status)?.label ?? 'Todos'
    );
  }

  selectedUsageLabel(): string {
    return (
      this.usageOptions.find((option) => option.value === this.current().usage)?.label ?? 'Todas'
    );
  }

  selectedColorLabel(): string {
    return (
      this.colorOptions.find((option) => option.value === this.current().color)?.label ??
      'Todos los colores'
    );
  }

  selectedColorValue(): string | null {
    return this.colorOptions.find((option) => option.value === this.current().color)?.color ?? null;
  }

  onSearchChange(event: Event): void {
    this.current.update((filters) => ({
      ...filters,
      searchTerm: (event.target as HTMLInputElement).value,
    }));
  }

  selectStatus(status: TagFilters['status']): void {
    this.current.update((filters) => ({ ...filters, status }));
    this.closeSelects();
  }

  selectUsage(usage: TagFilters['usage']): void {
    this.current.update((filters) => ({ ...filters, usage }));
    this.closeSelects();
  }

  selectColor(color: TagFilters['color']): void {
    this.current.update((filters) => ({ ...filters, color }));
    this.closeSelects();
  }

  onApply(): void {
    this.applyFilters.emit(this.current());
  }

  onClear(): void {
    this.current.set(DEFAULT_TAG_FILTERS);
    this.clear.emit();
  }
}
