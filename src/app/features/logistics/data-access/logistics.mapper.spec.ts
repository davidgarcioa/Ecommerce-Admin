import { logisticsOrderFixture } from './logistics.fixtures';
import { toLogisticsOrderListItem } from './logistics.mapper';

describe('logistics mapper', () => {
  it('maps order contracts to logistics list items', () => {
    const item = toLogisticsOrderListItem(logisticsOrderFixture);

    expect(item.id).toBe('order-1');
    expect(item.carrierLabel).toBe('Coordinadora');
    expect(item.trackingLabel).toBe('Sin guía');
    expect(item.dispatchStateLabel).toBe('Transportadora asignada');
    expect(item.incidentLabel).toBe('Con novedad');
  });
});
