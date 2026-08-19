import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TablePageChange } from '../../models/table-pagination.model';

@Component({
  selector: 'app-table-pagination',
  templateUrl: './table-pagination.html',
  styleUrl: './table-pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePaginationComponent {
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);

  readonly pageChange = output<TablePageChange>();

  readonly totalPages = computed(() => Math.max(Math.ceil(this.totalItems() / this.pageSize()), 1));
  readonly startItem = computed(() =>
    this.totalItems() === 0 ? 0 : this.pageIndex() * this.pageSize() + 1,
  );
  readonly endItem = computed(() =>
    Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalItems()),
  );

  goToPage(pageIndex: number): void {
    const nextPage = Math.min(Math.max(pageIndex, 0), this.totalPages() - 1);
    this.pageChange.emit({ pageIndex: nextPage, pageSize: this.pageSize() });
  }

  onPageSizeChange(event: Event): void {
    this.pageChange.emit({
      pageIndex: 0,
      pageSize: Number((event.target as HTMLSelectElement).value),
    });
  }
}
