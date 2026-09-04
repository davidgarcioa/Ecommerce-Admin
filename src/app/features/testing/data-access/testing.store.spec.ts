import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { accountScopedStorageKey } from '../../../core/services/account-storage.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TestingApiService } from './testing-api.service';
import { TestingStore } from './testing.store';

describe('TestingStore', () => {
  let store: TestingStore;

  beforeEach(() => {
    localStorage.clear();

    const apiStub = {
      listTests: vi.fn(() => throwError(() => new Error('Backend down'))),
      statistics: vi.fn(() => throwError(() => new Error('Backend down'))),
      getTest: vi.fn(() => throwError(() => new Error('Backend down'))),
      createTest: vi.fn(() => throwError(() => new Error('Backend down'))),
      updateTest: vi.fn(() => throwError(() => new Error('Backend down'))),
      archiveTest: vi.fn(() => throwError(() => new Error('Backend down'))),
      restoreTest: vi.fn(() => throwError(() => new Error('Backend down'))),
      deleteTest: vi.fn(() => throwError(() => new Error('Backend down'))),
    };

    TestBed.configureTestingModule({
      providers: [
        TestingStore,
        { provide: TestingApiService, useValue: apiStub },
        { provide: PermissionsService, useValue: { has: () => true } },
      ],
    });
    store = TestBed.inject(TestingStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('keeps a clean empty state when the backend is unavailable', () => {
    store.loadTests();

    expect(store.tests().length).toBe(0);
    expect(store.total()).toBe(store.tests().length);
    expect(store.error()).toBeNull();
  });

  it('creates tests locally when the backend create request fails', () => {
    let createdId = '';

    store.loadTests();
    store.create(
      {
        code: ' test-099 ',
        name: 'Prueba local',
        description: 'Validacion local',
        type: 'offer',
        status: 'draft',
        objective: 'Validar oferta principal',
        hypothesis: 'La oferta principal mejora conversion',
        associationType: 'none',
        associationEntityId: '',
        associationLabel: '',
        startDate: '2026-08-19',
        endDate: '',
        owner: 'Admin',
        resultSummary: '',
        winner: '',
      },
      (test) => {
        createdId = test.id;
      },
    );

    expect(createdId).toContain('test-test-099');
    expect(store.tests().some((test) => test.id === createdId)).toBe(true);
    expect(
      localStorage.getItem(accountScopedStorageKey('ecommerce.testing.local.records')),
    ).toContain('Prueba local');
  });

  it('loads detail and archives locally from a created local test', () => {
    let createdId = '';

    store.loadTests();
    store.create(
      {
        code: 'checkout-whatsapp',
        name: 'Checkout WhatsApp',
        description: 'Validacion del flujo',
        type: 'offer',
        status: 'draft',
        objective: 'Validar cierre por WhatsApp',
        hypothesis: 'El nuevo cierre mejora conversion',
        associationType: 'none',
        associationEntityId: '',
        associationLabel: '',
        startDate: '2026-08-19',
        endDate: '',
        owner: 'Admin',
        resultSummary: '',
        winner: '',
      },
      (test) => {
        createdId = test.id;
      },
    );
    store.loadTest(createdId);

    expect(store.selectedTest()?.id).toBe(createdId);

    store.archive(createdId);

    expect(store.selectedTest()?.status).toBe('archived');
    expect(store.archived()).toBeGreaterThan(0);
  });
});
