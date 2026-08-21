import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { DEFAULT_TESTING_FILTERS, TESTING_PERMISSIONS } from '../utils/testing.constants';
import { validateTestingForm } from '../utils/testing.validators';
import {
  toCreateTestingRequest,
  toTestingListItem,
  toUpdateTestingRequest,
} from './testing.mapper';
import {
  CreateTestingRequest,
  EcommerceTest,
  TestingAssociationType,
  TestingFilters,
  TestingFormValue,
  TestingListItem,
  TestingSortOption,
  TestingStatistics,
  TestingStatus,
  TestingType,
  UpdateTestingRequest,
} from './testing.models';
import { TestingApiService } from './testing-api.service';

const LOCAL_TESTS_STORAGE_KEY = 'ecommerce.testing.local.records';

@Injectable()
export class TestingStore {
  private readonly api = inject(TestingApiService);
  private readonly permissions = inject(PermissionsService);

  private readonly testsState = signal<readonly EcommerceTest[]>([]);
  private readonly statisticsState = signal<TestingStatistics | null>(null);
  private readonly selectedTestState = signal<EcommerceTest | null>(null);
  private readonly searchState = signal('');
  private readonly filtersState = signal<TestingFilters>(DEFAULT_TESTING_FILTERS);
  private readonly sortState = signal<TestingSortOption>('updatedAt');
  private readonly loadingState = signal(false);
  private readonly loadingDetailState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly validationErrorsState = signal<readonly string[]>([]);
  private readonly lastUpdatedState = signal<string | null>(null);

  readonly tests = this.testsState.asReadonly();
  readonly statistics = this.statisticsState.asReadonly();
  readonly selectedTest = this.selectedTestState.asReadonly();
  readonly search = this.searchState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadingDetail = this.loadingDetailState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly validationErrors = this.validationErrorsState.asReadonly();
  readonly lastUpdated = this.lastUpdatedState.asReadonly();

  readonly canRead = computed(() => this.permissions.has(TESTING_PERMISSIONS.read));
  readonly canCreate = computed(() => this.permissions.has(TESTING_PERMISSIONS.create));
  readonly canUpdate = computed(() => this.permissions.has(TESTING_PERMISSIONS.update));
  readonly canArchive = computed(() => this.permissions.has(TESTING_PERMISSIONS.archive));
  readonly canDelete = computed(() => this.permissions.has(TESTING_PERMISSIONS.delete));
  readonly canViewStatistics = computed(() => this.permissions.has(TESTING_PERMISSIONS.statistics));

  readonly listItems = computed(() => this.testsState().map(toTestingListItem));
  readonly filteredTests = computed(() =>
    sortTests(
      this.listItems().filter((test) => matchesTest(test, this.searchState(), this.filtersState())),
      this.sortState(),
    ),
  );

  readonly total = computed(() => this.statisticsState()?.total ?? this.testsState().length);
  readonly active = computed(
    () =>
      this.statisticsState()?.active ??
      this.testsState().filter((test) => test.status === 'active').length,
  );
  readonly completed = computed(
    () =>
      this.statisticsState()?.completed ??
      this.testsState().filter((test) => test.status === 'completed').length,
  );
  readonly archived = computed(
    () =>
      this.statisticsState()?.archived ??
      this.testsState().filter((test) => test.status === 'archived').length,
  );
  readonly draft = computed(
    () =>
      this.statisticsState()?.draft ??
      this.testsState().filter((test) => test.status === 'draft').length,
  );
  readonly paused = computed(
    () =>
      this.statisticsState()?.paused ??
      this.testsState().filter((test) => test.status === 'paused').length,
  );

  loadTests(): void {
    if (!this.canRead()) {
      this.errorState.set('No tienes permisos para consultar testeos.');
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    forkJoin({
      tests: this.api.listTests(),
      statistics: this.canViewStatistics() ? this.api.statistics() : of(null),
    })
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: ({ tests, statistics }) => {
          const storedTests = readStoredTests();
          const resolvedTests = storedTests ?? tests;

          this.replaceTests(resolvedTests, false);
          this.statisticsState.set(
            statistics && !storedTests ? statistics : buildTestingStatistics(resolvedTests),
          );
        },
        error: () => {
          this.replaceTests(readStoredTests() ?? [], false);
        },
      });
  }

  loadTest(id: string): void {
    this.loadingDetailState.set(true);
    this.errorState.set(null);
    this.selectedTestState.set(this.findKnownTest(id));

    this.api
      .getTest(id)
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: (test) => {
          const resolvedTest = test ?? this.findKnownTest(id);

          this.selectedTestState.set(resolvedTest);
          if (!resolvedTest) this.errorState.set('No se encontro el testeo solicitado.');
        },
        error: () => {
          const fallbackTest = this.findKnownTest(id);

          this.selectedTestState.set(fallbackTest);
          if (!fallbackTest) this.errorState.set('No se encontro el testeo solicitado.');
        },
      });
  }

  create(value: TestingFormValue, onSuccess: (test: EcommerceTest) => void): void {
    const validation = validateTestingForm(value, this.resolveWorkingTests(), null);
    this.validationErrorsState.set(validation.errors);
    if (!validation.valid) return;

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .createTest(toCreateTestingRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (test) => {
          this.upsertTest(test, true);
          onSuccess(test);
        },
        error: () => {
          const test = createLocalTest(toCreateTestingRequest(value));

          this.upsertTest(test, true);
          onSuccess(test);
        },
      });
  }

  update(id: string, value: TestingFormValue, onSuccess: (test: EcommerceTest) => void): void {
    const validation = validateTestingForm(value, this.resolveWorkingTests(), id);
    this.validationErrorsState.set(validation.errors);
    if (!validation.valid) return;

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateTest(id, toUpdateTestingRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (test) => {
          this.upsertTest(test, true);
          this.selectedTestState.set(test);
          onSuccess(test);
        },
        error: () => {
          const test = updateLocalTest(this.findKnownTest(id), toUpdateTestingRequest(value));

          if (!test) {
            this.errorState.set('No se encontro el testeo solicitado.');
            return;
          }

          this.upsertTest(test, true);
          this.selectedTestState.set(test);
          onSuccess(test);
        },
      });
  }

  archive(id: string): void {
    this.mutateTest(
      id,
      () => this.api.archiveTest(id),
      (test) => archiveLocalTest(test),
    );
  }

  restore(id: string): void {
    this.mutateTest(
      id,
      () => this.api.restoreTest(id),
      (test) => restoreLocalTest(test),
    );
  }

  delete(id: string, onSuccess?: () => void): void {
    this.deletingState.set(true);
    this.errorState.set(null);

    this.api
      .deleteTest(id)
      .pipe(finalize(() => this.deletingState.set(false)))
      .subscribe({
        next: () => {
          this.removeTest(id, true);
          onSuccess?.();
        },
        error: () => {
          this.removeTest(id, true);
          onSuccess?.();
        },
      });
  }

  applySearch(search: string): void {
    this.searchState.set(search);
  }

  applyFilters(filters: TestingFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.searchState.set('');
    this.filtersState.set(DEFAULT_TESTING_FILTERS);
  }

  setSort(sort: TestingSortOption): void {
    this.sortState.set(sort);
  }

  private mutateTest(
    id: string,
    request: () => ReturnType<TestingApiService['archiveTest']>,
    fallback: (test: EcommerceTest) => EcommerceTest,
  ): void {
    this.savingState.set(true);
    this.errorState.set(null);

    request()
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (test) => {
          this.upsertTest(test, true);
          this.selectedTestState.set(test);
        },
        error: () => {
          const test = this.findKnownTest(id);

          if (!test) {
            this.errorState.set('No se encontro el testeo solicitado.');
            return;
          }

          const updatedTest = fallback(test);

          this.upsertTest(updatedTest, true);
          this.selectedTestState.set(updatedTest);
        },
      });
  }

  private upsertTest(test: EcommerceTest, persist: boolean): void {
    const workingTests = this.resolveWorkingTests();
    const nextTests = workingTests.some((item) => item.id === test.id)
      ? workingTests.map((item) => (item.id === test.id ? test : item))
      : [test, ...workingTests];

    this.replaceTests(nextTests, persist);
  }

  private removeTest(id: string, persist: boolean): void {
    this.replaceTests(
      this.resolveWorkingTests().filter((test) => test.id !== id),
      persist,
    );

    if (this.selectedTestState()?.id === id) this.selectedTestState.set(null);
  }

  private replaceTests(tests: readonly EcommerceTest[], persist: boolean): void {
    this.testsState.set(tests);
    this.statisticsState.set(buildTestingStatistics(tests));
    this.lastUpdatedState.set(new Date().toISOString());

    if (persist) persistTests(tests);
  }

  private findKnownTest(id: string): EcommerceTest | null {
    return this.resolveWorkingTests().find((test) => test.id === id) ?? null;
  }

  private resolveWorkingTests(): readonly EcommerceTest[] {
    return this.testsState().length > 0 ? this.testsState() : (readStoredTests() ?? []);
  }
}

function matchesTest(test: TestingListItem, searchValue: string, filters: TestingFilters): boolean {
  const search = normalize(filters.searchTerm || searchValue);
  const searchable = normalize(
    `${test.name} ${test.code} ${test.objective} ${test.associationLabel} ${test.owner}`,
  );

  return (
    (!search || searchable.includes(search)) &&
    (filters.status === 'all' || test.status === filters.status) &&
    (filters.type === 'all' || test.type === filters.type) &&
    (filters.associationType === 'all' || test.associationType === filters.associationType)
  );
}

function sortTests(
  items: readonly TestingListItem[],
  sort: TestingSortOption,
): readonly TestingListItem[] {
  return [...items].sort((left, right) => {
    switch (sort) {
      case 'name':
        return left.name.localeCompare(right.name);
      case 'startDate':
        return right.startDate.localeCompare(left.startDate);
      case 'status':
        return left.statusLabel.localeCompare(right.statusLabel);
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

function buildTestingStatistics(tests: readonly EcommerceTest[]): TestingStatistics {
  return {
    total: tests.length,
    active: tests.filter((test) => test.status === 'active').length,
    completed: tests.filter((test) => test.status === 'completed').length,
    archived: tests.filter((test) => test.status === 'archived').length,
    draft: tests.filter((test) => test.status === 'draft').length,
    paused: tests.filter((test) => test.status === 'paused').length,
  };
}

function createLocalTest(payload: CreateTestingRequest): EcommerceTest {
  const now = new Date().toISOString();

  return {
    id: `test-${payload.code.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${Date.now()}`,
    code: payload.code,
    name: payload.name,
    description: payload.description,
    type: payload.type,
    status: payload.status ?? 'draft',
    objective: payload.objective,
    hypothesis: payload.hypothesis,
    association: payload.association,
    startDate: payload.startDate,
    endDate: payload.endDate,
    owner: payload.owner,
    resultSummary: payload.resultSummary,
    winner: payload.winner,
    createdBy: 'Local',
    createdAt: now,
    updatedAt: now,
  };
}

function updateLocalTest(
  test: EcommerceTest | null,
  payload: UpdateTestingRequest,
): EcommerceTest | null {
  if (!test) return null;

  return {
    ...test,
    code: payload.code ?? test.code,
    name: payload.name ?? test.name,
    description: payload.description ?? test.description,
    type: payload.type ?? test.type,
    status: payload.status ?? test.status,
    objective: payload.objective ?? test.objective,
    hypothesis: payload.hypothesis ?? test.hypothesis,
    association: payload.association ?? test.association,
    startDate: payload.startDate ?? test.startDate,
    endDate: payload.endDate ?? test.endDate,
    owner: payload.owner ?? test.owner,
    resultSummary: payload.resultSummary ?? test.resultSummary,
    winner: payload.winner ?? test.winner,
    updatedAt: new Date().toISOString(),
  };
}

function archiveLocalTest(test: EcommerceTest): EcommerceTest {
  const now = new Date().toISOString();

  return {
    ...test,
    status: 'archived',
    archivedAt: now,
    archivedBy: 'Local',
    updatedAt: now,
  };
}

function restoreLocalTest(test: EcommerceTest): EcommerceTest {
  return {
    ...test,
    status: 'active',
    archivedAt: undefined,
    archivedBy: undefined,
    updatedAt: new Date().toISOString(),
  };
}

function readStoredTests(): readonly EcommerceTest[] | null {
  try {
    const rawTests = globalThis.localStorage?.getItem(LOCAL_TESTS_STORAGE_KEY);

    if (!rawTests) return null;

    const parsedTests: unknown = JSON.parse(rawTests);

    if (!Array.isArray(parsedTests)) return null;

    return parsedTests.filter(isEcommerceTest);
  } catch {
    return null;
  }
}

function persistTests(tests: readonly EcommerceTest[]): void {
  try {
    globalThis.localStorage?.setItem(LOCAL_TESTS_STORAGE_KEY, JSON.stringify(tests));
  } catch {
    return;
  }
}

function isEcommerceTest(value: unknown): value is EcommerceTest {
  if (!value || typeof value !== 'object') return false;

  const test = value as Partial<EcommerceTest>;

  return (
    typeof test.id === 'string' &&
    typeof test.code === 'string' &&
    typeof test.name === 'string' &&
    isTestingType(test.type) &&
    isTestingStatus(test.status) &&
    typeof test.objective === 'string' &&
    typeof test.hypothesis === 'string' &&
    isTestingAssociationType(test.association?.type) &&
    typeof test.association?.label === 'string' &&
    typeof test.startDate === 'string' &&
    typeof test.owner === 'string' &&
    typeof test.createdBy === 'string' &&
    typeof test.createdAt === 'string' &&
    typeof test.updatedAt === 'string'
  );
}

function isTestingStatus(value: unknown): value is TestingStatus {
  return (
    value === 'draft' ||
    value === 'active' ||
    value === 'paused' ||
    value === 'completed' ||
    value === 'archived'
  );
}

function isTestingType(value: unknown): value is TestingType {
  return (
    value === 'campaign' ||
    value === 'creative' ||
    value === 'product-group' ||
    value === 'product' ||
    value === 'offer' ||
    value === 'operational'
  );
}

function isTestingAssociationType(value: unknown): value is TestingAssociationType {
  return (
    value === 'campaign' ||
    value === 'product-group' ||
    value === 'product' ||
    value === 'order' ||
    value === 'none'
  );
}
