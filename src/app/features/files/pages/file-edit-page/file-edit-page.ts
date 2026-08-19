import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  FileCategory,
  FileEntityType,
  FileMetadataFormValue,
  FileVisibility,
} from '../../data-access/files.models';
import { FilesStore } from '../../data-access/files.store';

@Component({
  selector: 'app-file-edit-page',
  imports: [ReactiveFormsModule],
  providers: [FilesStore],
  templateUrl: './file-edit-page.html',
  styleUrl: '../file-upload-page/file-upload-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly store = inject(FilesStore);
  private hydrated = false;

  readonly file = this.store.selectedFile;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly loading = this.store.detailLoading;

  readonly form = this.formBuilder.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    category: this.formBuilder.control<FileCategory>('document', Validators.required),
    visibility: this.formBuilder.control<FileVisibility>('internal', Validators.required),
    description: ['', Validators.maxLength(500)],
    relatedEntityType: this.formBuilder.control<FileEntityType>('general', Validators.required),
    relatedEntityId: [''],
    tags: [''],
  });

  constructor() {
    effect(() => {
      const file = this.file();
      if (!file || this.hydrated) return;
      this.hydrated = true;
      this.form.patchValue({
        displayName: file.displayName,
        category: file.category,
        visibility: file.visibility,
        description: file.description ?? '',
        relatedEntityType: file.relatedEntityType ?? 'general',
        relatedEntityId: file.relatedEntityId ?? '',
        tags: file.tags.join(', '),
      });
    });
  }

  private get fileId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.store.loadFile(this.fileId);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.update(
      this.fileId,
      this.form.getRawValue() as FileMetadataFormValue,
      (file) => void this.router.navigate(['/archivos', file.id]),
    );
  }

  cancel(): void {
    void this.router.navigate(['/archivos', this.fileId]);
  }
}
