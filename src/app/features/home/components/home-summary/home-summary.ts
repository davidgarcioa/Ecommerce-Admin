import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeModuleSummary } from '../../data-access/home.models';

@Component({
  selector: 'app-home-summary',
  imports: [RouterLink],
  templateUrl: './home-summary.html',
  styleUrl: './home-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSummaryComponent {
  readonly items = input.required<readonly HomeModuleSummary[]>();
  readonly loading = input(false);
}
