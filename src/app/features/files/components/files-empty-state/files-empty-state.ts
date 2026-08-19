import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-files-empty-state',
  templateUrl: './files-empty-state.html',
  styleUrl: './files-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesEmptyStateComponent {}
