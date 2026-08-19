import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-office-header',
  imports: [DatePipe],
  templateUrl: './office-header.html',
  styleUrl: './office-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeHeaderComponent {
  readonly loading = input(false);
  readonly lastUpdated = input<string | null>(null);

  readonly refresh = output<void>();
  readonly openPending = output<void>();
}
