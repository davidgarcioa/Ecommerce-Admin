import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import {
  DEFAULT_FILE_FILTERS,
  FILES_PERMISSION,
  MAX_UPLOAD_SIZE_BYTES,
} from '../utils/files.constants';
import { toFileListItem, toFileMetadataRequest } from './files.mapper';
import {
  FileFilters,
  FileMetadataFormValue,
  FileSortOption,
  FileStatistics,
  ManagedFile,
  ManagedFileListItem,
  UploadFileRequest,
} from './files.models';
import { FilesApiService } from './files-api.service';

@Injectable()
export class FilesStore {
  private readonly api = inject(FilesApiService);
  private readonly permissions = inject(PermissionsService);

  private readonly filesState = signal<readonly ManagedFile[]>([]);
  private readonly statisticsState = signal<FileStatistics | null>(null);
  private readonly selectedFileState = signal<ManagedFile | null>(null);
  private readonly searchState = signal('');
  private readonly filtersState = signal<FileFilters>(DEFAULT_FILE_FILTERS);
  private readonly sortState = signal<FileSortOption>('updatedAt');
  private readonly loadingState = signal(false);
  private readonly detailLoadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly validationErrorsState = signal<readonly string[]>([]);
  private readonly lastUpdatedState = signal<string | null>(null);

  readonly files = this.filesState.asReadonly();
  readonly statistics = this.statisticsState.asReadonly();
  readonly selectedFile = this.selectedFileState.asReadonly();
  readonly search = this.searchState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly sort = this.sortState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly detailLoading = this.detailLoadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly validationErrors = this.validationErrorsState.asReadonly();
  readonly lastUpdated = this.lastUpdatedState.asReadonly();
  readonly canManage = computed(() => this.permissions.has(FILES_PERMISSION));

  readonly listItems = computed(() => this.filesState().map(toFileListItem));
  readonly filteredFiles = computed(() =>
    sortFiles(
      this.listItems().filter((file) =>
        matchesFile(file, this.searchState(), this.filtersState()),
      ),
      this.sortState(),
    ),
  );
  readonly totalFiles = computed(() => this.statisticsState()?.total ?? this.filesState().length);
  readonly activeFiles = computed(
    () => this.statisticsState()?.active ?? this.filesState().filter((file) => file.status === 'active').length,
  );
  readonly archivedFiles = computed(
    () =>
      this.statisticsState()?.archived ??
      this.filesState().filter((file) => file.status === 'archived').length,
  );
  readonly images = computed(
    () => this.statisticsState()?.images ?? this.filesState().filter((file) => file.category === 'image').length,
  );
  readonly documents = computed(
    () =>
      this.statisticsState()?.documents ??
      this.filesState().filter((file) => file.category === 'document').length,
  );
  readonly totalSize = computed(
    () => this.statisticsState()?.totalSize ?? this.filesState().reduce((sum, file) => sum + file.size, 0),
  );

  loadFiles(): void {
    if (!this.canManage()) {
      this.errorState.set('No tienes permisos para administrar archivos.');
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    forkJoin({
      files: this.api.listFiles(),
      statistics: this.api.statistics().pipe(),
    })
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: ({ files, statistics }) => {
          this.filesState.set(files);
          this.statisticsState.set(statistics);
          this.lastUpdatedState.set(new Date().toISOString());
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  loadFile(id: string): void {
    this.detailLoadingState.set(true);
    this.errorState.set(null);

    this.api
      .getFile(id)
      .pipe(finalize(() => this.detailLoadingState.set(false)))
      .subscribe({
        next: (file) => this.selectedFileState.set(file),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  upload(request: UploadFileRequest, onSuccess: (file: ManagedFile) => void): void {
    const errors = validateUpload(request.file, request.metadata);
    this.validationErrorsState.set(errors);
    if (errors.length > 0) return;

    const formData = new FormData();
    formData.append('file', request.file);
    const metadata = toFileMetadataRequest(request.metadata);
    Object.entries(metadata).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => formData.append('tags', entry));
        return;
      }
      if (value !== undefined && value !== null) formData.append(key, String(value));
    });

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .uploadFile(formData)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (file) => {
          this.upsertFile(file);
          onSuccess(file);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  update(id: string, value: FileMetadataFormValue, onSuccess: (file: ManagedFile) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateFile(id, toFileMetadataRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (file) => {
          this.upsertFile(file);
          this.selectedFileState.set(file);
          onSuccess(file);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  archive(id: string): void {
    this.mutateFile(() => this.api.archiveFile(id));
  }

  restore(id: string): void {
    this.mutateFile(() => this.api.restoreFile(id));
  }

  delete(id: string, onSuccess?: () => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .deleteFile(id)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: () => {
          this.filesState.update((files) => files.filter((file) => file.id !== id));
          if (this.selectedFileState()?.id === id) this.selectedFileState.set(null);
          onSuccess?.();
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  openDownload(id: string): void {
    this.api.downloadUrl(id).subscribe({
      next: (access) => window.open(access.url, '_blank', 'noopener,noreferrer'),
      error: (error: Error) => this.errorState.set(error.message),
    });
  }

  applySearch(search: string): void {
    this.searchState.set(search);
  }

  applyFilters(filters: FileFilters): void {
    this.filtersState.set(filters);
  }

  setSort(sort: FileSortOption): void {
    this.sortState.set(sort);
  }

  clearFilters(): void {
    this.searchState.set('');
    this.filtersState.set(DEFAULT_FILE_FILTERS);
  }

  exportMetadata(): void {
    const rows = this.filteredFiles();
    const csv = [
      ['Nombre', 'Categoria', 'Estado', 'Tamano', 'Relacion', 'Actualizacion'],
      ...rows.map((file) => [
        file.displayName,
        file.categoryLabel,
        file.statusLabel,
        file.sizeLabel,
        file.relationLabel,
        file.updatedAt,
      ]),
    ]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `archivos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private mutateFile(request: () => ReturnType<FilesApiService['archiveFile']>): void {
    this.savingState.set(true);
    this.errorState.set(null);

    request()
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (file) => this.upsertFile(file),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  private upsertFile(file: ManagedFile): void {
    this.filesState.update((files) => {
      const exists = files.some((current) => current.id === file.id);
      return exists
        ? files.map((current) => (current.id === file.id ? file : current))
        : [file, ...files];
    });
  }
}

function matchesFile(file: ManagedFileListItem, search: string, filters: FileFilters): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch =
    !normalizedSearch ||
    [file.displayName, file.originalName, file.extension, file.relationLabel]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);

  return (
    matchesSearch &&
    (filters.status === 'all' || file.status === filters.status) &&
    (filters.category === 'all' || file.category === filters.category) &&
    (filters.visibility === 'all' || file.visibility === filters.visibility)
  );
}

function sortFiles(
  files: readonly ManagedFileListItem[],
  sort: FileSortOption,
): readonly ManagedFileListItem[] {
  return [...files].sort((first, second) => {
    if (sort === 'displayName') return first.displayName.localeCompare(second.displayName);
    if (sort === 'size') return second.size - first.size;
    if (sort === 'category') return first.category.localeCompare(second.category);
    return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
  });
}

function validateUpload(file: File, metadata: FileMetadataFormValue): readonly string[] {
  const errors: string[] = [];
  if (!metadata.displayName.trim()) errors.push('El nombre visible es obligatorio.');
  if (file.size <= 0) errors.push('El archivo está vacío.');
  if (file.size > MAX_UPLOAD_SIZE_BYTES) errors.push('El archivo supera 15 MB.');
  return errors;
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
