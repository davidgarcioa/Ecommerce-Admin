export type FileStatus = 'active' | 'archived' | 'deleted';
export type FileCategory = 'document' | 'image' | 'receipt' | 'evidence' | 'spreadsheet' | 'other';
export type FileVisibility = 'internal' | 'restricted';
export type FileEntityType =
  | 'campaign'
  | 'tag'
  | 'testing'
  | 'product-group'
  | 'expense'
  | 'order'
  | 'delivery'
  | 'return'
  | 'tracking'
  | 'office'
  | 'general';

export interface ManagedFile {
  readonly id: string;
  readonly originalName: string;
  readonly storedName: string;
  readonly displayName: string;
  readonly extension: string;
  readonly mimeType: string;
  readonly size: number;
  readonly status: FileStatus;
  readonly category: FileCategory;
  readonly visibility: FileVisibility;
  readonly description?: string;
  readonly uploadedBy: string;
  readonly ownerId: string;
  readonly relatedEntityType?: FileEntityType;
  readonly relatedEntityId?: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt?: string;
  readonly deletedAt?: string;
}

export interface ManagedFileListItem extends ManagedFile {
  readonly categoryLabel: string;
  readonly statusLabel: string;
  readonly sizeLabel: string;
  readonly relationLabel: string;
}

export interface FileStatistics {
  readonly total: number;
  readonly active: number;
  readonly archived: number;
  readonly deleted: number;
  readonly images: number;
  readonly documents: number;
  readonly spreadsheets: number;
  readonly withoutRelation: number;
  readonly totalSize: number;
}

export interface FileFilters {
  readonly status: FileStatus | 'all';
  readonly category: FileCategory | 'all';
  readonly visibility: FileVisibility | 'all';
}

export interface FileMetadataFormValue {
  readonly displayName: string;
  readonly category: FileCategory;
  readonly visibility: FileVisibility;
  readonly description: string;
  readonly relatedEntityType: FileEntityType;
  readonly relatedEntityId: string;
  readonly tags: string;
}

export type FileSortOption = 'updatedAt' | 'displayName' | 'size' | 'category';

export interface FileAccessUrl {
  readonly url: string;
  readonly expiresAt: string;
}

export interface UploadFileRequest {
  readonly file: File;
  readonly metadata: FileMetadataFormValue;
}
