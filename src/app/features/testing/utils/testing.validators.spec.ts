import { testingFixture } from '../data-access/testing.fixtures';
import { validateTestingForm } from './testing.validators';

describe('testing validators', () => {
  it('rejects duplicated codes and invalid dates', () => {
    const result = validateTestingForm(
      {
        code: 'TEST-001',
        name: 'Nuevo testeo',
        description: '',
        type: 'campaign',
        status: 'draft',
        objective: 'Objetivo valido',
        hypothesis: 'Hipotesis valida',
        associationType: 'none',
        associationEntityId: '',
        associationLabel: 'Sin asociacion',
        startDate: '2026-08-06',
        endDate: '2026-07-30',
        owner: 'Admin',
        resultSummary: '',
        winner: '',
      },
      [testingFixture],
      null,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Ya existe un testeo con ese codigo.');
    expect(result.errors).toContain('La fecha final no puede ser anterior a la fecha inicial.');
  });
});
