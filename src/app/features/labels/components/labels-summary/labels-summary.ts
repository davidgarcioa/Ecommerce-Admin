import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-labels-summary',
  templateUrl: './labels-summary.html',
  styleUrl: './labels-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsSummaryComponent {
  readonly total = input(0);
  readonly active = input(0);
  readonly archived = input(0);
  readonly used = input(0);
  readonly unused = input(0);
  readonly associations = input(0);
}
