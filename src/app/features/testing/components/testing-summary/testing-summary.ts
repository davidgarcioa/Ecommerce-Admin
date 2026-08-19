import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-testing-summary',
  templateUrl: './testing-summary.html',
  styleUrl: './testing-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingSummaryComponent {
  readonly total = input(0);
  readonly active = input(0);
  readonly completed = input(0);
  readonly archived = input(0);
  readonly draft = input(0);
  readonly paused = input(0);
}
