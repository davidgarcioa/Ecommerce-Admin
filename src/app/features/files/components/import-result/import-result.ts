import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImportResult } from '../../models/import-process.model';

@Component({
  selector: 'app-import-result',
  templateUrl: './import-result.html',
  styleUrl: './import-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportResultComponent {
  readonly result = input<ImportResult | null>(null);
  readonly newImport = output<void>();
  readonly history = output<void>();
  readonly download = output<void>();
  readonly finish = output<void>();
}
