import { toFileListItem, toFileMetadataRequest } from './files.mapper';
import { ManagedFile } from './files.models';

describe('files mapper', () => {
  const file: ManagedFile = {
    id: 'file-1',
    originalName: 'factura.pdf',
    storedName: 'stored.pdf',
    displayName: 'Factura',
    extension: 'pdf',
    mimeType: 'application/pdf',
    size: 2048,
    status: 'active',
    category: 'document',
    visibility: 'internal',
    uploadedBy: 'admin',
    ownerId: 'admin',
    relatedEntityType: 'expense',
    relatedEntityId: 'exp-1',
    tags: ['factura'],
    createdAt: '2026-07-30T12:00:00.000Z',
    updatedAt: '2026-07-30T12:00:00.000Z',
  };

  it('maps managed files to table rows', () => {
    const result = toFileListItem(file);

    expect(result.categoryLabel).toBe('Documento');
    expect(result.statusLabel).toBe('Activo');
    expect(result.sizeLabel).toBe('2 KB');
    expect(result.relationLabel).toBe('Gasto · exp-1');
  });

  it('normalizes metadata requests', () => {
    const result = toFileMetadataRequest({
      displayName: ' Factura ',
      category: 'receipt',
      visibility: 'restricted',
      description: '',
      relatedEntityType: 'expense',
      relatedEntityId: ' exp-2 ',
      tags: 'soporte, julio',
    });

    expect(result).toEqual({
      displayName: 'Factura',
      category: 'receipt',
      visibility: 'restricted',
      description: undefined,
      relatedEntityType: 'expense',
      relatedEntityId: 'exp-2',
      tags: ['soporte', 'julio'],
    });
  });
});
