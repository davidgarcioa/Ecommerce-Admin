import { AbstractControl, ValidationErrors } from '@angular/forms';

export function productGroupCodeValidator(
  control: AbstractControl<string>,
): ValidationErrors | null {
  const value = control.value.trim();

  if (!/^[A-Z0-9-]{2,30}$/.test(value)) {
    return { productGroupCode: true };
  }

  return null;
}

export function normalizeProductGroupCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '-');
}
