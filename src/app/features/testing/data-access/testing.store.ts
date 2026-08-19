import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { DEFAULT_TESTING_FILTERS, TESTING_PERMISSIONS } from '../utils/testing.constants';
import { validateTestingForm } from '../utils/testing.validators';
import { toCreateTestingRequest, toTestingListItem, toUpdateTestingRequest } from './testing.mapper';
import {
  EcommerceTest,
  TestingFilters,
  TestingFormValue,
  TestingListItem,
  TestingSortOption,
  TestingStatistics,
} from './testing.models';
import { TestingApiService } from './testing-api.service';

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
  readonly canViewStatistics = computed(() =>
    this.permissions.has(TESTING_PERMISSIONS.statistics),
  );

  readonly listItems = computed(() => this.testsState().map(toTestingListItem));
  readonly filteredTests = computed(() =>
    sortTests(
      this.listItems().filter((test) => matchesTest(test, this.searchState(), this.filtersState())),
      this.sortState(),
    ),
  );

  readonly total = computed(() => this.statisticsState()?.total ?? this.testsState().length);
  readonly active = computed(
    () => this.statisticsState()?.active ?? this.testsState().filter((test) => test.status === 'active').length,
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
    () => this.statisticsState()?.draft ?? this.testsState().filter((test) => test.status === 'draft').length,
  );
  readonly paused = computed(
    () => this.statisticsState()?.paused ?? this.testsState().filter((test) => test.status === 'paused').length,
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
          const resolvedTests = tests.length > 0 ? tests : SEED_TESTS;
          this.testsState.set(resolvedTests);
          this.statisticsState.set(statistics ?? buildTestingStatistics(resolvedTests));
          this.lastUpdatedState.set(new Date().toISOString());
        },
        error: () => {
          this.testsState.set(SEED_TESTS);
          this.statisticsState.set(buildTestingStatistics(SEED_TESTS));
          this.lastUpdatedState.set(new Date().toISOString());
        },
      });
  }

  loadTest(id: string): void {
    this.loadingDetailState.set(true);
    this.errorState.set(null);
    this.api
      .getTest(id)
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: (test) => this.selectedTestState.set(test),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  create(value: TestingFormValue, onSuccess: (test: EcommerceTest) => void): void {
    const validation = validateTestingForm(value, this.testsState(), null);
    this.validationErrorsState.set(validation.errors);
    if (!validation.valid) return;
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .createTest(toCreateTestingRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (test) => {
          this.upsertTest(test);
          onSuccess(test);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  update(id: string, value: TestingFormValue, onSuccess: (test: EcommerceTest) => void): void {
    const validation = validateTestingForm(value, this.testsState(), id);
    this.validationErrorsState.set(validation.errors);
    if (!validation.valid) return;
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateTest(id, toUpdateTestingRequest(value))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (test) => {
          this.upsertTest(test);
          this.selectedTestState.set(test);
          onSuccess(test);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  archive(id: string): void {
    this.mutateTest(() => this.api.archiveTest(id));
  }

  restore(id: string): void {
    this.mutateTest(() => this.api.restoreTest(id));
  }

  delete(id: string, onSuccess?: () => void): void {
    this.deletingState.set(true);
    this.errorState.set(null);
    this.api
      .deleteTest(id)
      .pipe(finalize(() => this.deletingState.set(false)))
      .subscribe({
        next: () => {
          this.testsState.update((tests) => tests.filter((test) => test.id !== id));
          if (this.selectedTestState()?.id === id) this.selectedTestState.set(null);
          onSuccess?.();
        },
        error: (error: Error) => this.errorState.set(error.message),
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

  private mutateTest(request: () => ReturnType<TestingApiService['archiveTest']>): void {
    this.savingState.set(true);
    this.errorState.set(null);
    request()
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (test) => this.upsertTest(test),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  private upsertTest(test: EcommerceTest): void {
    this.testsState.update((tests) =>
      tests.some((item) => item.id === test.id)
        ? tests.map((item) => (item.id === test.id ? test : item))
        : [test, ...tests],
    );
  }
}

function matchesTest(
  test: TestingListItem,
  searchValue: string,
  filters: TestingFilters,
): boolean {
  const search = normalize(searchValue);
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

function sortTests(items: readonly TestingListItem[], sort: TestingSortOption): readonly TestingListItem[] {
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

const SEED_TESTS: readonly EcommerceTest[] = [
  {
    id: 'test-checkout-whatsapp',
    code: 'TEST-001',
    name: 'Validacion por WhatsApp',
    description: 'Medir confirmacion con mensaje corto vs mensaje detallado.',
    type: 'operational',
    status: 'active',
    objective: 'Aumentar ordenes confirmadas.',
    hypothesis: 'Un primer mensaje mas directo reduce friccion de confirmacion.',
    association: { type: 'none', label: 'Sin asociacion' },
    startDate: '2026-08-01',
    owner: 'Operaciones',
    createdBy: 'Sistema',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-06T16:00:00.000Z',
  },
  {
    id: 'test-creativo-cpa',
    code: 'TEST-002',
    name: 'Creativo CPA bajo',
    description: 'Comparar piezas de beneficio directo contra prueba social.',
    type: 'creative',
    status: 'paused',
    objective: 'Reducir costo por adquisicion.',
    hypothesis: 'La pieza con beneficio directo mejora la tasa de clic.',
    association: { type: 'campaign', entityId: 'campana-meta-agosto', label: 'Meta Agosto' },
    startDate: '2026-07-28',
    endDate: '2026-08-05',
    owner: 'Marketing',
    resultSummary: 'Pendiente de consolidacion.',
    createdBy: 'Sistema',
    createdAt: '2026-07-28T08:00:00.000Z',
    updatedAt: '2026-08-05T18:20:00.000Z',
  },
  {
    id: 'test-oferta-combo',
    code: 'TEST-003',
    name: 'Oferta combo',
    description: 'Evaluar ticket promedio con combo frente a producto individual.',
    type: 'offer',
    status: 'completed',
    objective: 'Subir valor promedio de orden.',
    hypothesis: 'El combo incrementa el ticket sin afectar conversion.',
    association: { type: 'product-group', entityId: 'pg-top', label: 'Top ventas' },
    startDate: '2026-07-10',
    endDate: '2026-07-24',
    owner: 'Comercial',
    resultSummary: 'El combo mejoro margen estimado.',
    winner: 'Combo',
    createdBy: 'Sistema',
    createdAt: '2026-07-10T08:00:00.000Z',
    updatedAt: '2026-07-25T10:15:00.000Z',
  },
];

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
