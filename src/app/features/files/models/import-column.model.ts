export type ImportColumnDataType =
  'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean' | 'email' | 'phone' | 'status';

export interface ImportColumnDefinition {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly required: boolean;
  readonly dataType: ImportColumnDataType;
  readonly acceptedAliases: readonly string[];
  readonly example: string;
  readonly unique: boolean;
  readonly nullable: boolean;
  readonly defaultValue?: string | number | boolean;
  readonly validatorIds: readonly string[];
}
