import { EcommerceTest, TestingFormValue } from '../data-access/testing.models';
import { normalizeTestingCode, normalizeTestingText } from './testing.formatters';

export interface TestingValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function validateTestingForm(
  value: TestingFormValue,
  existing: readonly EcommerceTest[],
  currentId: string | null,
): TestingValidationResult {
  const errors: string[] = [];
  const code = normalizeTestingCode(value.code);
  const name = normalizeTestingText(value.name);

  if (code.length < 2) errors.push('El codigo debe tener minimo 2 caracteres.');
  if (name.length < 2) errors.push('El nombre debe tener minimo 2 caracteres.');
  if (normalizeTestingText(value.objective).length < 8)
    errors.push('El objetivo debe ser mas especifico.');
  if (normalizeTestingText(value.hypothesis).length < 8)
    errors.push('La hipotesis debe ser mas especifica.');
  if (!value.startDate) errors.push('La fecha inicial es obligatoria.');
  if (value.endDate && value.startDate && value.endDate < value.startDate) {
    errors.push('La fecha final no puede ser anterior a la fecha inicial.');
  }

  const duplicate = existing.some((item) => item.id !== currentId && item.code === code);
  if (duplicate) errors.push('Ya existe un testeo con ese codigo.');

  return { valid: errors.length === 0, errors };
}
