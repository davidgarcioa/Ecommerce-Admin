import {
  FILE_CATEGORY_LABELS,
  FILE_ENTITY_TYPE_LABELS,
  FILE_STATUS_LABELS,
} from '../utils/files.constants';
import { formatFileSize } from '../utils/files.formatters';
import { FileMetadataFormValue, ManagedFile, ManagedFileListItem } from './files.models';

export function toFileListItem(file: ManagedFile): ManagedFileListItem {
  return {
    ...file,
    categoryLabel: FILE_CATEGORY_LABELS[file.category],
    statusLabel: FILE_STATUS_LABELS[file.status],
    sizeLabel: formatFileSize(file.size),
    relationLabel: file.relatedEntityType
      ? `${FILE_ENTITY_TYPE_LABELS[file.relatedEntityType]}${file.relatedEntityId ? ` · ${file.relatedEntityId}` : ''}`
      : 'Sin relación',
  };
}

export function toFileMetadataRequest(value: FileMetadataFormValue): Record<string, unknown> {
  return {
    displayName: value.displayName.trim(),
    category: value.category,
    visibility: value.visibility,
    description: value.description.trim() || undefined,
    relatedEntityType: value.relatedEntityType,
    relatedEntityId: value.relatedEntityId.trim() || undefined,
    tags: value.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}
