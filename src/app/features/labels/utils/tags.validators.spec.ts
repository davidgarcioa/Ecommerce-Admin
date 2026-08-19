import { tagFixture } from '../data-access/tags.fixtures';
import { validateTagForm } from './tags.validators';

describe('tag validators', () => {
  it('rejects duplicate codes and names', () => {
    const result = validateTagForm(
      {
        code: 'VIP',
        name: 'cliente vip',
        description: '',
        color: '#A1A1A1',
        active: true,
      },
      [tagFixture],
      null,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Ya existe una etiqueta con ese codigo.');
    expect(result.errors).toContain('Ya existe una etiqueta con ese nombre.');
  });

  it('accepts the current record while editing', () => {
    const result = validateTagForm(
      {
        code: 'VIP',
        name: 'Cliente VIP',
        description: '',
        color: '',
        active: true,
      },
      [tagFixture],
      'tag-1',
    );

    expect(result.valid).toBe(true);
  });
});
