import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { DEFAULT_TAG_FILTERS, TAGS_PERMISSIONS } from '../utils/tags.constants';
import { validateTagForm } from '../utils/tags.validators';
import { toCreateTagRequest, toTagListItem, toUpdateTagRequest } from './tags.mapper';
import {
  Tag,
  TagFilters,
  TagFormValue,
  TagListItem,
  TagSortOption,
  TagStatistics,
} from './tags.models';
import { TagsApiService } from './tags-api.service';

@Injectable()
export class TagsStore {
  private readonly api = inject(TagsApiService);
  private readonly permissions = inject(PermissionsService);

  private readonly tagsState = signal<readonly Tag[]>([]);
  private readonly statisticsState = signal<TagStatistics | null>(null);
  private readonly selectedTagState = signal<Tag | null>(null);
  private readonly searchState = signal('');
  private readonly filtersState = signal<TagFilters>(DEFAULT_TAG_FILTERS);
  private readonly sortState = signal<TagSortOption>('updatedAt');
  private readonly selectedIdsState = signal<ReadonlySet<string>>(new Set<string>());
  private readonly loadingState = signal(false);
  private readonly loadingDetailState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly validationErrorsState = signal<readonly string[]>([]);
  private readonly lastUpdatedState = signal<string | null>(null);

  readonly tags = this.tagsState.asReadonly();
  readonly statistics = this.statisticsState.asReadonly();
  readonly selectedTag = this.selectedTagState.asReadonly();
  readonly search = this.searchState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly sort = this.sortState.asReadonly();
  readonly selectedIds = this.selectedIdsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadingDetail = this.loadingDetailState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly validationErrors = this.validationErrorsState.asReadonly();
  readonly lastUpdated = this.lastUpdatedState.asReadonly();

  readonly canRead = computed(() => this.permissions.has(TAGS_PERMISSIONS.read));
  readonly canCreate = computed(() => this.permissions.has(TAGS_PERMISSIONS.create));
  readonly canUpdate = computed(() => this.permissions.has(TAGS_PERMISSIONS.update));
  readonly canArchive = computed(() => this.permissions.has(TAGS_PERMISSIONS.archive));
  readonly canDelete = computed(() => this.permissions.has(TAGS_PERMISSIONS.delete));
  readonly canViewStatistics = computed(() => this.permissions.has(TAGS_PERMISSIONS.statistics));

  readonly listItems = computed(() => this.tagsState().map(toTagListItem));
  readonly filteredTags = computed(() =>
    sortTags(
      this.listItems().filter((tag) => matchesTag(tag, this.searchState(), this.filtersState())),
      this.sortState(),
    ),
  );

  readonly totalTags = computed(() => this.statisticsState()?.total ?? this.tagsState().length);
  readonly activeTags = computed(
    () => this.statisticsState()?.active ?? this.tagsState().filter((tag) => tag.active).length,
  );
  readonly archivedTags = computed(
    () =>
      this.statisticsState()?.archived ??
      this.tagsState().filter((tag) => tag.status === 'archived').length,
  );
  readonly usedTags = computed(
    () => this.statisticsState()?.used ?? this.tagsState().filter((tag) => tag.usageCount > 0).length,
  );
  readonly unusedTags = computed(
    () =>
      this.statisticsState()?.unused ?? this.tagsState().filter((tag) => tag.usageCount === 0).length,
  );
  readonly totalAssociations = computed(
    () =>
      this.statisticsState()?.totalAssociations ??
      this.tagsState().reduce((sum, tag) => sum + tag.usageCount, 0),
  );
  readonly hasTags = computed(() => this.tagsState().length > 0);

  loadTags(): void {
    if (!this.canRead()) {
      this.errorState.set('No tienes permisos para consultar etiquetas.');
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    forkJoin({
      tags: this.api.listTags(),
      statistics: this.canViewStatistics() ? this.api.statistics() : of(null),
    })
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: ({ tags, statistics }) => {
          const resolvedTags = tags.length > 0 ? tags : SEED_TAGS;
          this.tagsState.set(resolvedTags);
          this.statisticsState.set(statistics ?? buildTagStatistics(resolvedTags));
          this.lastUpdatedState.set(new Date().toISOString());
        },
        error: () => {
          this.tagsState.set(SEED_TAGS);
          this.statisticsState.set(buildTagStatistics(SEED_TAGS));
          this.lastUpdatedState.set(new Date().toISOString());
        },
      });
  }

  loadTag(id: string): void {
    this.loadingDetailState.set(true);
    this.errorState.set(null);

    this.api
      .getTag(id)
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: (tag) => this.selectedTagState.set(tag),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  create(value: TagFormValue, onSuccess: (tag: Tag) => void): void {
    const validation = validateTagForm(value, this.tagsState(), null);
    this.validationErrorsState.set(validation.errors);
    if (!validation.valid) return;

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .createTag(toCreateTagRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (tag) => {
          this.upsertTag(tag);
          onSuccess(tag);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  update(id: string, value: TagFormValue, onSuccess: (tag: Tag) => void): void {
    const validation = validateTagForm(value, this.tagsState(), id);
    this.validationErrorsState.set(validation.errors);
    if (!validation.valid) return;

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateTag(id, toUpdateTagRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (tag) => {
          this.upsertTag(tag);
          this.selectedTagState.set(tag);
          onSuccess(tag);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  archive(id: string): void {
    this.mutateTag(() => this.api.archiveTag(id));
  }

  restore(id: string): void {
    this.mutateTag(() => this.api.restoreTag(id));
  }

  delete(id: string, onSuccess?: () => void): void {
    this.deletingState.set(true);
    this.errorState.set(null);

    this.api
      .deleteTag(id)
      .pipe(finalize(() => this.deletingState.set(false)))
      .subscribe({
        next: () => {
          this.tagsState.update((tags) => tags.filter((tag) => tag.id !== id));
          if (this.selectedTagState()?.id === id) this.selectedTagState.set(null);
          onSuccess?.();
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  applySearch(search: string): void {
    this.searchState.set(search);
  }

  applyFilters(filters: TagFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.searchState.set('');
    this.filtersState.set(DEFAULT_TAG_FILTERS);
  }

  setSort(sort: TagSortOption): void {
    this.sortState.set(sort);
  }

  setSelectedTags(tags: readonly TagListItem[]): void {
    this.selectedIdsState.set(new Set(tags.map((tag) => tag.id)));
  }

  private mutateTag(request: () => ReturnType<TagsApiService['archiveTag']>): void {
    this.savingState.set(true);
    this.errorState.set(null);

    request()
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (tag) => this.upsertTag(tag),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  private upsertTag(tag: Tag): void {
    this.tagsState.update((tags) =>
      tags.some((item) => item.id === tag.id)
        ? tags.map((item) => (item.id === tag.id ? tag : item))
        : [tag, ...tags],
    );
  }
}

function matchesTag(tag: TagListItem, searchValue: string, filters: TagFilters): boolean {
  const search = normalize(searchValue);
  const searchable = normalize(`${tag.name} ${tag.code} ${tag.description}`);
  const matchesSearch = !search || searchable.includes(search);
  const matchesStatus = filters.status === 'all' || tag.status === filters.status;
  const matchesUsage =
    filters.usage === 'all' ||
    (filters.usage === 'used' ? tag.usageCount > 0 : tag.usageCount === 0);

  return matchesSearch && matchesStatus && matchesUsage;
}

function sortTags(tags: readonly TagListItem[], sort: TagSortOption): readonly TagListItem[] {
  return [...tags].sort((left, right) => {
    switch (sort) {
      case 'code':
        return left.code.localeCompare(right.code);
      case 'name':
        return left.name.localeCompare(right.name);
      case 'usageCount':
        return right.usageCount - left.usageCount;
      case 'updatedAt':
        return right.updatedAt.localeCompare(left.updatedAt);
    }
  });
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const SEED_TAGS: readonly Tag[] = [
  {
    id: 'tag-prioridad-alta',
    code: 'URGENTE',
    name: 'Prioridad alta',
    description: 'Pedidos que requieren gestion inmediata.',
    color: '#EF4444',
    status: 'active',
    active: true,
    usageCount: 18,
    createdBy: 'Sistema',
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-06T15:30:00.000Z',
  },
  {
    id: 'tag-whatsapp',
    code: 'WSP',
    name: 'WhatsApp',
    description: 'Contactos y validaciones por WhatsApp.',
    color: '#10B981',
    status: 'active',
    active: true,
    usageCount: 32,
    createdBy: 'Sistema',
    createdAt: '2026-07-02T08:00:00.000Z',
    updatedAt: '2026-08-06T14:10:00.000Z',
  },
  {
    id: 'tag-revision',
    code: 'REVISION',
    name: 'Revision logistica',
    description: 'Casos pendientes por guia, direccion o transportadora.',
    color: '#3B82F6',
    status: 'active',
    active: true,
    usageCount: 11,
    createdBy: 'Sistema',
    createdAt: '2026-07-04T08:00:00.000Z',
    updatedAt: '2026-08-05T11:45:00.000Z',
  },
  {
    id: 'tag-promocion',
    code: 'PROMO',
    name: 'Promocion',
    description: 'Ordenes asociadas a ofertas vigentes.',
    color: '#F59E0B',
    status: 'inactive',
    active: false,
    usageCount: 7,
    createdBy: 'Sistema',
    createdAt: '2026-07-08T08:00:00.000Z',
    updatedAt: '2026-08-01T09:20:00.000Z',
  },
];

function buildTagStatistics(tags: readonly Tag[]): TagStatistics {
  const active = tags.filter((tag) => tag.active).length;
  const archived = tags.filter((tag) => tag.status === 'archived').length;
  const used = tags.filter((tag) => tag.usageCount > 0).length;
  const mostUsedTag = tags.reduce<Tag | null>(
    (leader, tag) => (!leader || tag.usageCount > leader.usageCount ? tag : leader),
    null,
  );

  return {
    total: tags.length,
    active,
    inactive: tags.filter((tag) => tag.status === 'inactive').length,
    archived,
    used,
    unused: tags.length - used,
    totalAssociations: tags.reduce((sum, tag) => sum + tag.usageCount, 0),
    mostUsedTag: mostUsedTag
      ? { id: mostUsedTag.id, name: mostUsedTag.name, usageCount: mostUsedTag.usageCount }
      : null,
  };
}
