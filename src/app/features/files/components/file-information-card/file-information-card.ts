import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ImportedFile } from '../../models/imported-file.model';

@Component({
  selector: 'app-file-information-card',
  templateUrl: './file-information-card.html',
  styleUrl: './file-information-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileInformationCardComponent {
  readonly file = input<ImportedFile | null>(null);
}
