import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-files-error-state',
  templateUrl: './files-error-state.html',
  styleUrl: './files-error-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesErrorStateComponent {
  readonly message = input.required<string>();
}
