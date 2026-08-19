import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-files-header',
  templateUrl: './files-header.html',
  styleUrl: './files-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesHeaderComponent {
  readonly newImport = output<void>();
  readonly openTemplates = output<void>();
}
