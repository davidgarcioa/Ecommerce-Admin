import { testingFixture } from './testing.fixtures';
import { toCreateTestingRequest, toTestingListItem } from './testing.mapper';

describe('testing mapper', () => {
  it('maps backend tests to table rows', () => {
    const item = toTestingListItem(testingFixture);

    expect(item.statusLabel).toBe('Activo');
    expect(item.typeLabel).toBe('Campana');
    expect(item.associationLabel).toContain('Campana Helvor');
  });

  it('normalizes create payloads', () => {
    const payload = toCreateTestingRequest({
      code: ' test 001 ',
      name: ' Testeo   oferta ',
      description: '',
      type: 'campaign',
      status: 'draft',
      objective: ' Validar oferta principal ',
      hypothesis: ' La oferta principal mejora ventas ',
      associationType: 'none',
      associationEntityId: '',
      associationLabel: '',
      startDate: '2026-07-30',
      endDate: '',
      owner: ' Admin ',
      resultSummary: '',
      winner: '',
    });

    expect(payload.code).toBe('TEST001');
    expect(payload.name).toBe('Testeo oferta');
    expect(payload.association.label).toBe('Sin asociacion');
  });
});
