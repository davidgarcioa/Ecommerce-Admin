import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImportedFile } from '../../models/imported-file.model';
import { ImportType } from '../../models/import-type.model';
import { ImportValidationResult } from '../../models/import-validation-result.model';
import { SpreadsheetSheet } from '../../models/spreadsheet-sheet.model';

@Component({
  selector: 'app-import-confirmation',
  templateUrl: './import-confirmation.html',
  styleUrl: './import-confirmation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportConfirmationComponent {
  readonly type = input<ImportType | null>(null);
  readonly file = input<ImportedFile | null>(null);
  readonly sheet = input<SpreadsheetSheet | null>(null);
  readonly validation = input<ImportValidationResult | null>(null);
  readonly accepted = input(false);
  readonly acceptedChange = output<boolean>();
  readonly confirm = output<void>();
  readonly back = output<void>();
}
