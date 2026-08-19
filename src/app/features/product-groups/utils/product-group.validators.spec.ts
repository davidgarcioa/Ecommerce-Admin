import { FormControl } from '@angular/forms';

import { normalizeProductGroupCode, productGroupCodeValidator } from './product-group.validators';

describe('product group validators', () => {
  it('normalizes codes', () => {
    expect(normalizeProductGroupCode(' helvor 2 ')).toBe('HELVOR-2');
  });

  it('validates strict codes', () => {
    expect(
      productGroupCodeValidator(new FormControl('HELVOR-2', { nonNullable: true })),
    ).toBeNull();
    expect(productGroupCodeValidator(new FormControl('helvor dos', { nonNullable: true }))).toEqual(
      {
        productGroupCode: true,
      },
    );
  });
});
