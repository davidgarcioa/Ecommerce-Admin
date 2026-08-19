import { Tag, TagFormValue } from '../data-access/tags.models';
import { isValidTagColor, normalizeTagCode, normalizeTagName } from './tags.formatters';

export interface TagValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function validateTagForm(
  value: TagFormValue,
  existingTags: readonly Tag[],
  currentId: string | null,
): TagValidationResult {
  const errors: string[] = [];
  const code = normalizeTagCode(value.code);
  const name = normalizeTagName(value.name);
  const normalizedName = normalizeSearch(name);

  if (code.length < 2) errors.push('El codigo debe tener minimo 2 caracteres.');
  if (name.length < 2) errors.push('El nombre debe tener minimo 2 caracteres.');
  if (value.color.trim() && !isValidTagColor(value.color)) {
    errors.push('El color debe tener formato hexadecimal, por ejemplo #A1A1A1.');
  }

  const duplicateCode = existingTags.some((tag) => tag.id !== currentId && tag.code === code);
  if (duplicateCode) errors.push('Ya existe una etiqueta con ese codigo.');

  const duplicateName = existingTags.some(
    (tag) => tag.id !== currentId && normalizeSearch(tag.name) === normalizedName,
  );
  if (duplicateName) errors.push('Ya existe una etiqueta con ese nombre.');

  return { valid: errors.length === 0, errors };
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
