import { validateImportFile } from './file.utils';

describe('file utils', () => {
  it('should reject invalid extensions', () => {
    const file = new File(['contenido'], 'ordenes.txt', { type: 'text/plain' });

    expect(validateImportFile(file)).toContain('.xlsx');
  });

  it('should reject files that are too large', () => {
    const file = new File(['contenido'], 'ordenes.csv', { type: 'text/csv' });

    expect(validateImportFile(file, 1)).toContain('tamaño máximo');
  });
});
