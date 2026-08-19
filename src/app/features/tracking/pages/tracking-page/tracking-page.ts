import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { TrackingHeaderComponent } from '../../components/tracking-header/tracking-header';
import { TrackingInfoCardsComponent } from '../../components/tracking-info-cards/tracking-info-cards';
import { TrackingMultipleResultsComponent } from '../../components/tracking-multiple-results/tracking-multiple-results';
import { TrackingResultSummaryComponent } from '../../components/tracking-result-summary/tracking-result-summary';
import { TrackingSearchComponent } from '../../components/tracking-search/tracking-search';
import { TrackingTimelineComponent } from '../../components/tracking-timeline/tracking-timeline';
import {
  TrackingRecentSearch,
  TrackingSearchResult,
  TrackingSearchType,
} from '../../data-access/tracking.models';
import { TrackingStore } from '../../data-access/tracking.store';

@Component({
  selector: 'app-tracking-page',
  imports: [
    TrackingHeaderComponent,
    TrackingSearchComponent,
    TrackingResultSummaryComponent,
    TrackingInfoCardsComponent,
    TrackingTimelineComponent,
    TrackingMultipleResultsComponent,
  ],
  providers: [TrackingStore],
  templateUrl: './tracking-page.html',
  styleUrl: './tracking-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingPageComponent {
  private readonly store = inject(TrackingStore);
  private readonly router = inject(Router);

  readonly searchType = this.store.searchType;
  readonly searchValue = this.store.searchValue;
  readonly recentSearches = this.store.recentSearches;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly results = this.store.searchResults;
  readonly selected = this.store.selectedTracking;
  readonly hasMultipleResults = this.store.hasMultipleResults;
  readonly canViewOrder = this.store.canViewOrder;
  readonly canViewLogistics = this.store.canViewLogistics;
  readonly lastSearch = this.store.lastSearch;

  setType(type: TrackingSearchType): void {
    this.store.setSearchType(type);
  }

  setValue(value: string): void {
    this.store.setSearchValue(value);
  }

  search(): void {
    this.store.search();
  }

  clear(): void {
    this.store.clear();
  }

  useRecent(search: TrackingRecentSearch): void {
    if (!search.value) return;
    this.store.setSearchType(search.type);
    this.store.setSearchValue(search.value);
    this.store.search();
  }

  selectResult(result: TrackingSearchResult): void {
    this.store.selectResult(result);
  }

  copy(value: string): void {
    void navigator.clipboard?.writeText(value);
  }

  openOffice(id: string): void {
    void this.router.navigate(['/oficina/pedidos', id]);
  }

  openLogistics(id: string): void {
    void this.router.navigate(['/torre-logistica/despachos', id]);
  }
}
