import { Tag, TagFormValue, TagListItem } from './tags.models';
import {
  formatTagStatus,
  normalizeTagCode,
  normalizeTagColor,
  normalizeTagName,
  resolveSafeTagColor,
} from '../utils/tags.formatters';

export function toTagListItem(tag: Tag): TagListItem {
  return {
    id: tag.id,
    code: tag.code,
    name: tag.name,
    description: tag.description ?? 'Sin descripcion',
    color: resolveSafeTagColor(tag.color),
    status: tag.status,
    statusLabel: formatTagStatus(tag.status),
    activeLabel: tag.active ? 'Si' : 'No',
    usageCount: tag.usageCount,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

export function toCreateTagRequest(value: TagFormValue) {
  const description = normalizeOptional(value.description);
  const color = normalizeTagColor(value.color);

  return {
    code: normalizeTagCode(value.code),
    name: normalizeTagName(value.name),
    ...(description ? { description } : {}),
    ...(color ? { color } : {}),
    active: value.active,
  };
}

export function toUpdateTagRequest(value: TagFormValue) {
  const description = normalizeOptional(value.description);
  const color = normalizeTagColor(value.color);

  return {
    code: normalizeTagCode(value.code),
    name: normalizeTagName(value.name),
    description,
    color: color || undefined,
    active: value.active,
  };
}

function normalizeOptional(value: string): string | undefined {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || undefined;
}
