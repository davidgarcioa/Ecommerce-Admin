import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { SpreadsheetSheet } from '../../models/spreadsheet-sheet.model';

@Component({
  selector: 'app-sheet-selector',
  templateUrl: './sheet-selector.html',
  styleUrl: './sheet-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetSelectorComponent {
  readonly sheets = input.required<readonly SpreadsheetSheet[]>();
  readonly selectedSheet = input<SpreadsheetSheet | null>(null);
  readonly selectSheet = output<string>();
}
