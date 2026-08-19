import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImportProgress } from '../../models/import-process.model';

@Component({
  selector: 'app-import-progress',
  templateUrl: './import-progress.html',
  styleUrl: './import-progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportProgressComponent {
  readonly progress = input.required<ImportProgress>();
  readonly cancel = output<void>();
}
