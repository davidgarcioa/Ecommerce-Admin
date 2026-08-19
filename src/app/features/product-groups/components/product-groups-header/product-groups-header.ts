import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-product-groups-header',
  imports: [DatePipe],
  templateUrl: './product-groups-header.html',
  styleUrl: './product-groups-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupsHeaderComponent {
  readonly canCreate = input(false);
  readonly loading = input(false);
  readonly lastUpdated = input<string | null>(null);

  readonly create = output<void>();
  readonly refresh = output<void>();
}
