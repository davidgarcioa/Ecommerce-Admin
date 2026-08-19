import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImportValidationResult } from '../../models/import-validation-result.model';

@Component({
  selector: 'app-validation-summary',
  templateUrl: './validation-summary.html',
  styleUrl: './validation-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationSummaryComponent {
  readonly result = input<ImportValidationResult | null>(null);
  readonly applyFixes = output<void>();
  readonly exportErrors = output<void>();
  readonly continue = output<void>();
}
