import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeWorkItem } from '../../data-access/home.models';
import { formatHomeNumber } from '../../utils/home-date.utils';

@Component({
  selector: 'app-home-work-items',
  imports: [RouterLink],
  templateUrl: './home-work-items.html',
  styleUrl: './home-work-items.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeWorkItemsComponent {
  readonly title = input.required<string>();
  readonly emptyText = input.required<string>();
  readonly items = input.required<readonly HomeWorkItem[]>();

  readonly formatNumber = formatHomeNumber;
}
