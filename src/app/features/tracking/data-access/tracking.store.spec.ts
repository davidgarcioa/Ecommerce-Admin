import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { toTrackingSearchResult } from './tracking.mapper';
import { TrackingApiService } from './tracking-api.service';
import { trackingHistoryFixture, trackingOrderFixture } from './tracking.fixtures';
import { TrackingStore } from './tracking.store';

const result = toTrackingSearchResult(trackingOrderFixture, [trackingHistoryFixture]);

describe('TrackingStore', () => {
  let store: TrackingStore;
  let api: {
    readonly search: ReturnType<typeof vi.fn>;
    readonly getByOrderId: ReturnType<typeof vi.fn>;
    readonly getByTrackingNumber: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      search: vi.fn(() => of({ results: [result], metadata: { partial: false, warnings: [] } })),
      getByOrderId: vi.fn(() => of(result)),
      getByTrackingNumber: vi.fn(() =>
        of({ results: [result], metadata: { partial: false, warnings: [] } }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        TrackingStore,
        { provide: TrackingApiService, useValue: api },
        { provide: PermissionsService, useValue: { has: () => true } },
      ],
    });
    store = TestBed.inject(TrackingStore);
  });

  it('searches and selects a single tracking result', () => {
    store.setSearchType('order');
    store.setSearchValue('ORD-2026-0001');
    store.search();

    expect(store.hasSingleResult()).toBe(true);
    expect(store.selectedTracking()?.order.orderNumber).toBe('ORD-2026-0001');
  });

  it('rejects invalid searches without calling the API', () => {
    store.setSearchType('name');
    store.setSearchValue('Lu');
    store.search();

    expect(api.search).not.toHaveBeenCalled();
    expect(store.error()).toContain('al menos');
  });

  it('loads direct detail by order id', () => {
    store.loadByOrderId('order-1');

    expect(api.getByOrderId).toHaveBeenCalledWith('order-1');
    expect(store.selectedTracking()?.id).toBe('order-1');
  });
});
