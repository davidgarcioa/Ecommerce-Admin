import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImportType } from '../../models/import-type.model';

@Component({
  selector: 'app-import-type-selector',
  templateUrl: './import-type-selector.html',
  styleUrl: './import-type-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportTypeSelectorComponent {
  readonly types = input.required<readonly ImportType[]>();
  readonly selectedType = input<ImportType | null>(null);
  readonly selectType = output<ImportType>();
}
