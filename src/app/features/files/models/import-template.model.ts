import { ImportTypeId } from './import-type.model';

export interface ImportTemplate {
  readonly id: string;
  readonly typeId: ImportTypeId;
  readonly name: string;
  readonly description: string;
  readonly requiredColumns: readonly string[];
  readonly optionalColumns: readonly string[];
  readonly updatedAt: string;
  readonly formats: readonly ('csv' | 'xlsx')[];
  readonly exampleRow: readonly string[];
}
