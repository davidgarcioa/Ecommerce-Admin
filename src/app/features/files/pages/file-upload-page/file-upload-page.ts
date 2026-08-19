import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  FileCategory,
  FileEntityType,
  FileMetadataFormValue,
  FileVisibility,
} from '../../data-access/files.models';
import { FilesStore } from '../../data-access/files.store';

@Component({
  selector: 'app-file-upload-page',
  imports: [ReactiveFormsModule],
  providers: [FilesStore],
  templateUrl: './file-upload-page.html',
  styleUrl: './file-upload-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly store = inject(FilesStore);

  readonly selectedFile = signal<File | null>(null);
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly validationErrors = this.store.validationErrors;

  readonly form = this.formBuilder.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    category: this.formBuilder.control<FileCategory>('document', Validators.required),
    visibility: this.formBuilder.control<FileVisibility>('internal', Validators.required),
    description: ['', Validators.maxLength(500)],
    relatedEntityType: this.formBuilder.control<FileEntityType>('general', Validators.required),
    relatedEntityId: [''],
    tags: [''],
  });

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.selectedFile.set(file);

    if (file && !this.form.controls.displayName.value) {
      this.form.controls.displayName.setValue(file.name);
    }
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.upload(
      {
        file,
        metadata: this.form.getRawValue() as FileMetadataFormValue,
      },
      (created) => void this.router.navigate(['/archivos', created.id]),
    );
  }

  cancel(): void {
    void this.router.navigate(['/archivos']);
  }
}
