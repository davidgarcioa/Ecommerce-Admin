import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { TRACKING_PERMISSIONS } from '../utils/tracking.constants';
import { persistRecentSearch, readRecentSearches } from '../utils/tracking-search.utils';
import { normalizeTrackingValue, validateTrackingSearch } from '../utils/tracking.validators';
import {
  TrackingConsolidatedResult,
  TrackingRecentSearch,
  TrackingSearchQuery,
  TrackingSearchResult,
  TrackingSearchType,
} from './tracking.models';
import { TrackingApiService } from './tracking-api.service';

@Injectable()
export class TrackingStore {
  private readonly api = inject(TrackingApiService);
  private readonly permissions = inject(PermissionsService);

  private readonly searchTypeState = signal<TrackingSearchType>('order');
  private readonly searchValueState = signal('');
  private readonly searchResultsState = signal<readonly TrackingSearchResult[]>([]);
  private readonly selectedTrackingState = signal<TrackingSearchResult | null>(null);
  private readonly recentSearchesState =
    signal<readonly TrackingRecentSearch[]>(readRecentSearches());
  private readonly loadingState = signal(false);
  private readonly loadingDetailState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly lastSearchState = signal<TrackingSearchQuery | null>(null);
  private readonly metadataState = signal<TrackingConsolidatedResult['metadata']>({
    partial: false,
    warnings: [],
  });

  readonly searchType = this.searchTypeState.asReadonly();
  readonly searchValue = this.searchValueState.asReadonly();
  readonly searchResults = this.searchResultsState.asReadonly();
  readonly selectedTracking = this.selectedTrackingState.asReadonly();
  readonly recentSearches = this.recentSearchesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadingDetail = this.loadingDetailState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly lastSearch = this.lastSearchState.asReadonly();
  readonly metadata = this.metadataState.asReadonly();

  readonly hasQuery = computed(() => this.searchValueState().trim().length > 0);
  readonly hasResults = computed(() => this.searchResultsState().length > 0);
  readonly hasSingleResult = computed(() => this.searchResultsState().length === 1);
  readonly hasMultipleResults = computed(() => this.searchResultsState().length > 1);
  readonly hasTimeline = computed(() => (this.selectedTrackingState()?.timeline.length ?? 0) > 0);
  readonly hasNovelty = computed(
    () => this.selectedTrackingState()?.currentStatus.hasNovelty ?? false,
  );
  readonly hasReturn = computed(
    () => this.selectedTrackingState()?.returnSummary.hasReturn ?? false,
  );
  readonly isDelivered = computed(
    () => this.selectedTrackingState()?.shipment.deliveryStatus === 'Delivered',
  );
  readonly isInTransit = computed(
    () => this.selectedTrackingState()?.shipment.deliveryStatus === 'In Transit',
  );
  readonly isDelayed = computed(() => false);
  readonly canViewOrder = computed(() => this.permissions.has(TRACKING_PERMISSIONS.ordersRead));
  readonly canViewLogistics = this.canViewOrder;
  readonly canViewCustomerData = this.canViewOrder;
  readonly canCopyPhone = this.canViewOrder;
  readonly canOpenExternalTracking = computed(() => false);

  setSearchType(type: TrackingSearchType): void {
    this.searchTypeState.set(type);
  }

  setSearchValue(value: string): void {
    this.searchValueState.set(value);
  }

  search(): void {
    const query: TrackingSearchQuery = {
      type: this.searchTypeState(),
      value: normalizeTrackingValue(this.searchTypeState(), this.searchValueState()),
    };
    const validation = validateTrackingSearch(query);

    if (!validation.valid) {
      this.errorState.set(validation.message ?? 'La búsqueda no es válida.');
      return;
    }

    if (!this.canViewOrder()) {
      this.errorState.set('No tienes permisos para consultar rastreo.');
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);
    this.lastSearchState.set(query);

    this.api
      .search(query)
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (result) => {
          this.searchResultsState.set(result.results);
          this.selectedTrackingState.set(result.results.length === 1 ? result.results[0] : null);
          this.metadataState.set(result.metadata);
          this.recentSearchesState.set(persistRecentSearch(query));
          if (result.results.length === 0) {
            this.errorState.set('No encontramos resultados con los datos ingresados.');
          }
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  loadByOrderId(orderId: string): void {
    if (!this.canViewOrder()) {
      this.errorState.set('No tienes permisos para consultar rastreo.');
      return;
    }

    this.loadingDetailState.set(true);
    this.errorState.set(null);
    this.api
      .getByOrderId(orderId)
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: (result) => {
          this.selectedTrackingState.set(result);
          this.searchResultsState.set(result ? [result] : []);
          if (!result) this.errorState.set('No encontramos resultados con los datos ingresados.');
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  loadByTrackingNumber(trackingNumber: string): void {
    this.searchTypeState.set('tracking');
    this.searchValueState.set(trackingNumber);
    this.search();
  }

  selectResult(result: TrackingSearchResult): void {
    this.selectedTrackingState.set(result);
  }

  clear(): void {
    this.searchValueState.set('');
    this.searchResultsState.set([]);
    this.selectedTrackingState.set(null);
    this.errorState.set(null);
    this.lastSearchState.set(null);
  }
}
