import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  templateUrl: './table-skeleton.html',
  styleUrl: './table-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSkeletonComponent {
  readonly rows = input(6);
  readonly columns = input(5);
}
