import { accountScopedStorageKey } from '../../../core/services/account-storage.service';
import { TrackingRecentSearch, TrackingSearchQuery } from '../data-access/tracking.models';
import { TRACKING_RECENT_SEARCHES_KEY } from './tracking.constants';
import { maskEmail, maskPhone } from './tracking.formatters';

export function maskSearchValue(query: TrackingSearchQuery): string {
  if (query.type === 'phone') return maskPhone(query.value);
  if (query.type === 'email') return maskEmail(query.value) ?? query.value;
  if (query.type === 'name') return `${query.value.slice(0, 2)}***`;
  return query.value;
}

export function readRecentSearches(): readonly TrackingRecentSearch[] {
  try {
    const raw = localStorage.getItem(accountScopedStorageKey(TRACKING_RECENT_SEARCHES_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as readonly TrackingRecentSearch[];
    return parsed.slice(0, 5);
  } catch {
    return [];
  }
}

export function persistRecentSearch(query: TrackingSearchQuery): readonly TrackingRecentSearch[] {
  const item: TrackingRecentSearch = {
    type: query.type,
    value: canPersistFullValue(query.type) ? query.value : undefined,
    valueMasked: maskSearchValue(query),
    searchedAt: new Date().toISOString(),
  };
  const next = [
    item,
    ...readRecentSearches().filter(
      (entry) => entry.type !== item.type || entry.valueMasked !== item.valueMasked,
    ),
  ].slice(0, 5);
  try {
    localStorage.setItem(
      accountScopedStorageKey(TRACKING_RECENT_SEARCHES_KEY),
      JSON.stringify(next),
    );
  } catch {
    return next;
  }
  return next;
}

function canPersistFullValue(type: TrackingSearchQuery['type']): boolean {
  return type === 'order' || type === 'tracking';
}
