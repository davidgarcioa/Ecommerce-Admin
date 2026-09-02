import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';

import { API_CONFIG, isStaticFrontendApi } from '../../../core/config/api.config';
import { PermissionsService } from '../../../core/services/permissions.service';
import { DEFAULT_TAG_FILTERS, TAGS_PERMISSIONS } from '../utils/tags.constants';
import { resolveSafeTagColor } from '../utils/tags.formatters';
import { validateTagForm } from '../utils/tags.validators';
import { toCreateTagRequest, toTagListItem, toUpdateTagRequest } from './tags.mapper';
import {
  CreateTagRequest,
  Tag,
  TagFilters,
  TagFormValue,
  TagListItem,
  TagSortOption,
  TagStatistics,
  UpdateTagRequest,
} from './tags.models';
import { TagsApiService } from './tags-api.service';

const LOCAL_TAGS_STORAGE_KEY = 'ecommerce.tags.local.records';

@Injectable()
export class TagsStore {
  private readonly api = inject(TagsApiService);
  private readonly apiConfig = inject(API_CONFIG);
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
    () =>
      this.statisticsState()?.used ?? this.tagsState().filter((tag) => tag.usageCount > 0).length,
  );
  readonly unusedTags = computed(
    () =>
      this.statisticsState()?.unused ??
      this.tagsState().filter((tag) => tag.usageCount === 0).length,
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

    if (this.isStaticMode()) {
      this.replaceTags(readStoredTags() ?? [], false);
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
          const storedTags = readStoredTags();
          const resolvedTags = storedTags ?? tags;

          this.replaceTags(resolvedTags, false);
          this.statisticsState.set(
            statistics && !storedTags ? statistics : buildTagStatistics(resolvedTags),
          );
        },
        error: () => {
          this.replaceTags(readStoredTags() ?? [], false);
        },
      });
  }

  loadTag(id: string): void {
    if (this.isStaticMode()) {
      const tag = this.findKnownTag(id);

      this.selectedTagState.set(tag);
      this.errorState.set(tag ? null : 'No se encontro la etiqueta solicitada.');
      return;
    }

    this.loadingDetailState.set(true);
    this.errorState.set(null);
    this.selectedTagState.set(this.findKnownTag(id));

    this.api
      .getTag(id)
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: (tag) => {
          const resolvedTag = tag ?? this.findKnownTag(id);

          this.selectedTagState.set(resolvedTag);
          if (!resolvedTag) this.errorState.set('No se encontro la etiqueta solicitada.');
        },
        error: () => {
          const fallbackTag = this.findKnownTag(id);

          this.selectedTagState.set(fallbackTag);
          if (!fallbackTag) this.errorState.set('No se encontro la etiqueta solicitada.');
        },
      });
  }

  create(value: TagFormValue, onSuccess: (tag: Tag) => void): void {
    const validation = validateTagForm(value, this.tagsState(), null);
    this.validationErrorsState.set(validation.errors);
    if (!validation.valid) return;

    if (this.isStaticMode()) {
      const tag = createLocalTag(toCreateTagRequest(value));

      this.upsertTag(tag, true);
      onSuccess(tag);
      return;
    }

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .createTag(toCreateTagRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (tag) => {
          this.upsertTag(tag, true);
          onSuccess(tag);
        },
        error: () => {
          const tag = createLocalTag(toCreateTagRequest(value));

          this.upsertTag(tag, true);
          onSuccess(tag);
        },
      });
  }

  update(id: string, value: TagFormValue, onSuccess: (tag: Tag) => void): void {
    const validation = validateTagForm(value, this.tagsState(), id);
    this.validationErrorsState.set(validation.errors);
    if (!validation.valid) return;

    if (this.isStaticMode()) {
      const tag = updateLocalTag(this.findKnownTag(id), toUpdateTagRequest(value));

      if (!tag) {
        this.errorState.set('No se encontro la etiqueta solicitada.');
        return;
      }

      this.upsertTag(tag, true);
      this.selectedTagState.set(tag);
      onSuccess(tag);
      return;
    }

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateTag(id, toUpdateTagRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (tag) => {
          this.upsertTag(tag, true);
          this.selectedTagState.set(tag);
          onSuccess(tag);
        },
        error: () => {
          const tag = updateLocalTag(this.findKnownTag(id), toUpdateTagRequest(value));

          if (!tag) {
            this.errorState.set('No se encontro la etiqueta solicitada.');
            return;
          }

          this.upsertTag(tag, true);
          this.selectedTagState.set(tag);
          onSuccess(tag);
        },
      });
  }

  archive(id: string): void {
    if (this.isStaticMode()) {
      this.applyLocalTagMutation(id, archiveLocalTag);
      return;
    }

    this.mutateTag(
      id,
      () => this.api.archiveTag(id),
      (tag) => archiveLocalTag(tag),
    );
  }

  restore(id: string): void {
    if (this.isStaticMode()) {
      this.applyLocalTagMutation(id, restoreLocalTag);
      return;
    }

    this.mutateTag(
      id,
      () => this.api.restoreTag(id),
      (tag) => restoreLocalTag(tag),
    );
  }

  delete(id: string, onSuccess?: () => void): void {
    if (this.isStaticMode()) {
      this.removeTag(id, true);
      onSuccess?.();
      return;
    }

    this.deletingState.set(true);
    this.errorState.set(null);

    this.api
      .deleteTag(id)
      .pipe(finalize(() => this.deletingState.set(false)))
      .subscribe({
        next: () => {
          this.removeTag(id, true);
          onSuccess?.();
        },
        error: () => {
          this.removeTag(id, true);
          onSuccess?.();
        },
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

  private mutateTag(
    id: string,
    request: () => ReturnType<TagsApiService['archiveTag']>,
    fallback: (tag: Tag) => Tag,
  ): void {
    this.savingState.set(true);
    this.errorState.set(null);

    request()
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (tag) => {
          this.upsertTag(tag, true);
          this.selectedTagState.set(tag);
        },
        error: () => {
          const tag = this.findKnownTag(id);

          if (!tag) {
            this.errorState.set('No se encontro la etiqueta solicitada.');
            return;
          }

          const updatedTag = fallback(tag);

          this.upsertTag(updatedTag, true);
          this.selectedTagState.set(updatedTag);
        },
      });
  }

  private applyLocalTagMutation(id: string, transform: (tag: Tag) => Tag): void {
    const tag = this.findKnownTag(id);

    if (!tag) {
      this.errorState.set('No se encontro la etiqueta solicitada.');
      return;
    }

    const updatedTag = transform(tag);

    this.upsertTag(updatedTag, true);
    this.selectedTagState.set(updatedTag);
  }

  private upsertTag(tag: Tag, persist: boolean): void {
    const nextTags = this.resolveWorkingTags().some((item) => item.id === tag.id)
      ? this.resolveWorkingTags().map((item) => (item.id === tag.id ? tag : item))
      : [tag, ...this.resolveWorkingTags()];

    this.replaceTags(nextTags, persist);
  }

  private removeTag(id: string, persist: boolean): void {
    this.replaceTags(
      this.resolveWorkingTags().filter((tag) => tag.id !== id),
      persist,
    );

    if (this.selectedTagState()?.id === id) this.selectedTagState.set(null);
  }

  private replaceTags(tags: readonly Tag[], persist: boolean): void {
    this.tagsState.set(tags);
    this.statisticsState.set(buildTagStatistics(tags));
    this.lastUpdatedState.set(new Date().toISOString());

    if (persist) persistTags(tags);
  }

  private findKnownTag(id: string): Tag | null {
    return this.resolveWorkingTags().find((tag) => tag.id === id) ?? null;
  }

  private resolveWorkingTags(): readonly Tag[] {
    return this.tagsState().length > 0 ? this.tagsState() : (readStoredTags() ?? []);
  }

  private isStaticMode(): boolean {
    return isStaticFrontendApi(this.apiConfig.baseUrl);
  }
}

function matchesTag(tag: TagListItem, searchValue: string, filters: TagFilters): boolean {
  const search = normalize(filters.searchTerm || searchValue);
  const searchable = normalize(`${tag.name} ${tag.code} ${tag.description}`);
  const matchesSearch = !search || searchable.includes(search);
  const matchesStatus = filters.status === 'all' || tag.status === filters.status;
  const matchesUsage =
    filters.usage === 'all' ||
    (filters.usage === 'used' ? tag.usageCount > 0 : tag.usageCount === 0);
  const matchesColor = filters.color === 'all' || resolveSafeTagColor(tag.color) === filters.color;

  return matchesSearch && matchesStatus && matchesUsage && matchesColor;
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

function createLocalTag(payload: CreateTagRequest): Tag {
  const now = new Date().toISOString();
  const active = payload.active;

  return {
    id: `tag-${payload.code.toLowerCase()}-${Date.now()}`,
    code: payload.code,
    name: payload.name,
    description: payload.description,
    color: payload.color,
    status: active ? 'active' : 'inactive',
    active,
    usageCount: 0,
    createdBy: 'Local',
    createdAt: now,
    updatedAt: now,
  };
}

function updateLocalTag(tag: Tag | null, payload: UpdateTagRequest): Tag | null {
  if (!tag) return null;

  const now = new Date().toISOString();
  const active = payload.active ?? tag.active;

  return {
    ...tag,
    code: payload.code ?? tag.code,
    name: payload.name ?? tag.name,
    description: payload.description,
    color: payload.color,
    active,
    status: active ? 'active' : 'inactive',
    archivedAt: active ? undefined : tag.archivedAt,
    archivedBy: active ? undefined : tag.archivedBy,
    updatedAt: now,
  };
}

function archiveLocalTag(tag: Tag): Tag {
  const now = new Date().toISOString();

  return {
    ...tag,
    status: 'archived',
    active: false,
    archivedAt: now,
    archivedBy: 'Local',
    updatedAt: now,
  };
}

function restoreLocalTag(tag: Tag): Tag {
  return {
    ...tag,
    status: 'active',
    active: true,
    archivedAt: undefined,
    archivedBy: undefined,
    updatedAt: new Date().toISOString(),
  };
}

function readStoredTags(): readonly Tag[] | null {
  try {
    const rawTags = globalThis.localStorage?.getItem(LOCAL_TAGS_STORAGE_KEY);

    if (!rawTags) return null;

    const parsedTags: unknown = JSON.parse(rawTags);

    if (!Array.isArray(parsedTags)) return null;

    return parsedTags.filter(isTag);
  } catch {
    return null;
  }
}

function persistTags(tags: readonly Tag[]): void {
  try {
    globalThis.localStorage?.setItem(LOCAL_TAGS_STORAGE_KEY, JSON.stringify(tags));
  } catch {
    return;
  }
}

function isTag(value: unknown): value is Tag {
  if (!value || typeof value !== 'object') return false;

  const tag = value as Partial<Tag>;

  return (
    typeof tag.id === 'string' &&
    typeof tag.code === 'string' &&
    typeof tag.name === 'string' &&
    typeof tag.active === 'boolean' &&
    typeof tag.usageCount === 'number' &&
    isTagStatus(tag.status) &&
    typeof tag.createdBy === 'string' &&
    typeof tag.createdAt === 'string' &&
    typeof tag.updatedAt === 'string'
  );
}

function isTagStatus(value: unknown): value is Tag['status'] {
  return value === 'active' || value === 'inactive' || value === 'archived';
}
