import { orderFixture } from './office.fixtures';
import { toOrderCustomer, toOrderListItem, toOrderObservation } from './office.mapper';

describe('office mapper', () => {
  it('maps order list labels without changing the original order', () => {
    const item = toOrderListItem(orderFixture);

    expect(item.id).toBe(orderFixture.id);
    expect(item.orderStatusLabel).toBe('Pendiente');
    expect(item.paymentStatusLabel).toBe('Pendiente');
    expect(item.deliveryStatusLabel).toBe('Pendiente');
    expect(item.priorityLabel).toBe('Urgente');
  });

  it('maps customer detail from an order', () => {
    const customer = toOrderCustomer(orderFixture);

    expect(customer.id).toBe('customer-1');
    expect(customer.phone).toBe('+573001112233');
    expect(customer.address).toBe('Calle 100 # 15-20');
  });

  it('maps observations only when content exists', () => {
    expect(toOrderObservation(orderFixture)?.content).toContain('llamada');
    expect(toOrderObservation({ ...orderFixture, observations: '' })).toBeNull();
  });
});
