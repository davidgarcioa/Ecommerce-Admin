import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-tracking-header',
  templateUrl: './tracking-header.html',
  styleUrl: './tracking-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingHeaderComponent {
  readonly lastSearchLabel = input<string | null>(null);
}
