import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { formatDateTime, formatFileSize } from '../../utils/files.formatters';
import { FilesStore } from '../../data-access/files.store';

@Component({
  selector: 'app-file-detail-page',
  imports: [],
  providers: [FilesStore],
  templateUrl: './file-detail-page.html',
  styleUrl: './file-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(FilesStore);

  readonly file = this.store.selectedFile;
  readonly loading = this.store.detailLoading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;

  private get fileId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.store.loadFile(this.fileId);
  }

  back(): void {
    void this.router.navigate(['/archivos']);
  }

  edit(): void {
    void this.router.navigate(['/archivos', this.fileId, 'editar']);
  }

  download(): void {
    this.store.openDownload(this.fileId);
  }

  archive(): void {
    this.store.archive(this.fileId);
  }

  restore(): void {
    this.store.restore(this.fileId);
  }

  delete(): void {
    this.store.delete(this.fileId, () => void this.router.navigate(['/archivos']));
  }

  readonly formatDateTime = formatDateTime;
  readonly formatFileSize = formatFileSize;
}
