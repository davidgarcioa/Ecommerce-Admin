import { trackingHistoryFixture, trackingOrderFixture } from './tracking.fixtures';
import { toTrackingSearchResult, toTrackingTimeline } from './tracking.mapper';

describe('tracking mapper', () => {
  it('builds a protected tracking summary from an order', () => {
    const result = toTrackingSearchResult(trackingOrderFixture, [trackingHistoryFixture]);

    expect(result.id).toBe('order-1');
    expect(result.customer.phoneMasked).not.toBe(trackingOrderFixture.customerPhone);
    expect(result.customer.emailMasked).toContain('***');
    expect(result.shipment.trackingNumber).toBe('GUIA-123');
    expect(result.currentStatus.description).toContain('tránsito');
  });

  it('creates a chronological timeline without fictitious events', () => {
    const timeline = toTrackingTimeline(trackingOrderFixture, [trackingHistoryFixture]);

    expect(timeline.length).toBe(2);
    expect(timeline[0]?.title).toBe('Pedido creado');
    expect(timeline[1]?.source).toBe('order-history');
  });
});
