import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { ImportedFile } from '../../models/imported-file.model';

@Component({
  selector: 'app-file-upload-dropzone',
  templateUrl: './file-upload-dropzone.html',
  styleUrl: './file-upload-dropzone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadDropzoneComponent {
  readonly importedFile = input<ImportedFile | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly fileSelected = output<File>();
  readonly removeFile = output<void>();
  readonly dragOver = signal(false);

  onInputChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }
}
