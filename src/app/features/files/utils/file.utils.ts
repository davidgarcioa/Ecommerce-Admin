import { ACCEPTED_IMPORT_EXTENSIONS, MAX_IMPORT_FILE_SIZE } from '../constants/files.constants';
import { ImportedFile } from '../models/imported-file.model';

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImportFile(file: File, maxSize = MAX_IMPORT_FILE_SIZE): string | null {
  const extension = getFileExtension(file.name);

  if (
    !ACCEPTED_IMPORT_EXTENSIONS.includes(extension as (typeof ACCEPTED_IMPORT_EXTENSIONS)[number])
  ) {
    return 'El archivo debe tener extensión .xlsx, .xls o .csv.';
  }

  if (file.size === 0) {
    return 'El archivo está vacío.';
  }

  if (file.size > maxSize) {
    return 'El archivo supera el tamaño máximo permitido de 15 MB.';
  }

  if (file.name.length > 160) {
    return 'El nombre del archivo es demasiado largo.';
  }

  return null;
}

export function createImportedFile(file: File, validationMessage: string | null): ImportedFile {
  return {
    id: `file-${Date.now()}`,
    file,
    name: file.name,
    extension: getFileExtension(file.name),
    mimeType: file.type,
    size: file.size,
    formattedSize: formatFileSize(file.size),
    lastModified: new Date(file.lastModified).toISOString(),
    importedAt: new Date().toISOString(),
    status: validationMessage ? 'invalid' : 'pending',
    validationMessage: validationMessage ?? undefined,
    sheetCount: 0,
  };
}
