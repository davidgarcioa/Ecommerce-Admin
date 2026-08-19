import { TestBed } from '@angular/core/testing';

import {
  DEFAULT_DASHBOARD_FILTER,
  GENERAL_PRODUCT_GROUP_ID,
} from '../constants/dashboard.constants';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardService);
  });

  it('should load dashboard data', () => {
    expect(service.summary().primaryMetrics.length).toBe(5);
    expect(service.summary().operationalMetrics.length).toBe(8);
    expect(service.productGroups().length).toBeGreaterThan(0);
  });

  it('should update metrics when product group changes', () => {
    service.createProductGroup({
      name: 'Grupo de prueba',
      description: 'Grupo local para filtros',
      status: 'Activo',
      productCount: 2,
    });

    service.selectProductGroup('grupo-de-prueba');

    expect(service.filters().productGroupId).toBe('grupo-de-prueba');
    expect(service.filterMessage()).toBe('Filtro aplicado: Grupo de prueba.');
  });

  it('should clear filters and restore general view', () => {
    service.selectProductGroup('fondal');

    service.clearFilters();

    expect(service.filters()).toEqual(DEFAULT_DASHBOARD_FILTER);
    expect(service.summary().selectedProductGroupId).toBe(GENERAL_PRODUCT_GROUP_ID);
  });

  it('should create a product group in memory', () => {
    const initialLength = service.productGroups().length;

    service.createProductGroup({
      name: 'Nuevo conjunto',
      description: 'Prueba local',
      status: 'Activo',
      productCount: 1,
    });

    expect(service.productGroups().length).toBe(initialLength + 1);
  });

  it('should request confirmation before deleting a product group', () => {
    service.createProductGroup({
      name: 'Conjunto eliminable',
      description: 'Prueba local',
      status: 'Activo',
      productCount: 1,
    });

    service.deleteProductGroup('conjunto-eliminable');

    expect(service.pendingDeleteProductGroupId()).toBe('conjunto-eliminable');
    expect(
      service.productGroups().some((productGroup) => productGroup.id === 'conjunto-eliminable'),
    ).toBe(true);
  });
});
