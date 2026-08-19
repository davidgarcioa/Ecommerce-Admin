import { EcommerceTest } from './testing.models';

export const testingFixture: EcommerceTest = {
  id: 'test-1',
  code: 'TEST-001',
  name: 'Validacion oferta Helvor',
  description: 'Comparar mensaje de garantia.',
  type: 'campaign',
  status: 'active',
  objective: 'Mejorar confirmacion de pedidos.',
  hypothesis: 'Si el mensaje enfatiza garantia, aumenta la confirmacion.',
  association: { type: 'campaign', entityId: 'campaign-1', label: 'Campana Helvor' },
  startDate: '2026-07-30',
  endDate: '2026-08-06',
  owner: 'Administrador',
  createdBy: 'user-1',
  createdAt: '2026-07-30T12:00:00.000Z',
  updatedAt: '2026-07-30T12:00:00.000Z',
};
