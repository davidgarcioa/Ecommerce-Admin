import { tagFixture } from './tags.fixtures';
import { toCreateTagRequest, toTagListItem } from './tags.mapper';

describe('tags mapper', () => {
  it('maps backend tags to table rows', () => {
    const item = toTagListItem(tagFixture);

    expect(item.name).toBe('Cliente VIP');
    expect(item.statusLabel).toBe('Activas');
    expect(item.activeLabel).toBe('Si');
    expect(item.color).toBe('#A1A1A1');
  });

  it('normalizes form payload before creating', () => {
    const payload = toCreateTagRequest({
      code: ' vip externo ',
      name: '  Cliente   Externo ',
      description: '',
      color: '#a1a1a1',
      active: true,
    });

    expect(payload).toEqual({
      code: 'VIPEXTERNO',
      name: 'Cliente Externo',
      color: '#A1A1A1',
      active: true,
    });
  });
});
