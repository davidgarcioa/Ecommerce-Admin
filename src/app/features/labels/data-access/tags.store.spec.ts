import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { TagsApiService } from './tags-api.service';
import { TagsStore } from './tags.store';

describe('TagsStore', () => {
  let store: TagsStore;

  beforeEach(() => {
    localStorage.clear();

    const apiStub = {
      listTags: vi.fn(() => throwError(() => new Error('Backend down'))),
      statistics: vi.fn(() => throwError(() => new Error('Backend down'))),
      getTag: vi.fn(() => throwError(() => new Error('Backend down'))),
      createTag: vi.fn(() => throwError(() => new Error('Backend down'))),
      updateTag: vi.fn(() => throwError(() => new Error('Backend down'))),
      archiveTag: vi.fn(() => throwError(() => new Error('Backend down'))),
      restoreTag: vi.fn(() => throwError(() => new Error('Backend down'))),
      deleteTag: vi.fn(() => throwError(() => new Error('Backend down'))),
    };

    TestBed.configureTestingModule({
      providers: [
        TagsStore,
        { provide: TagsApiService, useValue: apiStub },
        { provide: PermissionsService, useValue: { has: () => true } },
      ],
    });
    store = TestBed.inject(TagsStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('keeps a clean empty state when the backend is unavailable', () => {
    store.loadTags();

    expect(store.tags().length).toBe(0);
    expect(store.totalTags()).toBe(store.tags().length);
    expect(store.error()).toBeNull();
  });

  it('creates tags locally when the backend create request fails', () => {
    let createdId = '';

    store.loadTags();
    store.create(
      {
        code: ' mayorista ',
        name: 'Mayorista',
        description: 'Compra por volumen',
        color: '#10B981',
        active: true,
      },
      (tag) => {
        createdId = tag.id;
      },
    );

    expect(createdId).toContain('tag-mayorista');
    expect(store.tags().some((tag) => tag.id === createdId)).toBe(true);
    expect(localStorage.getItem('ecommerce.tags.local.records')).toContain('Mayorista');
  });

  it('loads detail and archives locally from a created local tag', () => {
    let createdId = '';

    store.loadTags();
    store.create(
      {
        code: 'whatsapp',
        name: 'WhatsApp',
        description: 'Conversaciones comerciales',
        color: '#25D366',
        active: true,
      },
      (tag) => {
        createdId = tag.id;
      },
    );
    store.loadTag(createdId);

    expect(store.selectedTag()?.id).toBe(createdId);

    store.archive(createdId);

    expect(store.selectedTag()?.status).toBe('archived');
    expect(store.archivedTags()).toBeGreaterThan(0);
  });
});
