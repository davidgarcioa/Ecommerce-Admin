import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { EcommerceTest } from '../../data-access/testing.models';
import { formatTestingDate, formatTestingStatus, formatTestingType } from '../../utils/testing.formatters';

@Component({
  selector: 'app-testing-detail-card',
  templateUrl: './testing-detail-card.html',
  styleUrl: './testing-detail-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingDetailCardComponent {
  readonly test = input.required<EcommerceTest>();
  readonly canUpdate = input(false);
  readonly canArchive = input(false);
  readonly canDelete = input(false);
  readonly edit = output<void>();
  readonly archive = output<void>();
  readonly restore = output<void>();
  readonly deleteTest = output<void>();

  protected date(value: string | undefined): string {
    return value ? formatTestingDate(value) : 'Sin fecha';
  }

  protected status(value: EcommerceTest['status']): string {
    return formatTestingStatus(value);
  }

  protected type(value: EcommerceTest['type']): string {
    return formatTestingType(value);
  }
}
