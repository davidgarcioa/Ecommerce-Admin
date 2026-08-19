import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableAction } from './models/table-action.model';
import { TableColumn } from './models/table-column.model';
import { TableFilter } from './models/table-filter.model';
import { DataTableComponent } from './data-table.component';

interface TestRow {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly status: string;
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent<TestRow>>;
  const data: readonly TestRow[] = [
    { id: '1', name: 'Beta', value: 20, status: 'Activo' },
    { id: '2', name: 'Alfa', value: 10, status: 'Pausado' },
  ];
  const columns: readonly TableColumn<TestRow>[] = [
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'value',
      label: 'Valor',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent<DataTableComponent<TestRow>>(DataTableComponent);
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdKey', 'id');
  });

  it('should render columns and rows', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Nombre');
    expect(compiled.textContent).toContain('Beta');
  });

  it('should sort ascending and descending', () => {
    fixture.detectChanges();
    fixture.componentInstance.onSort(columns[0]);

    expect(fixture.componentInstance.pagedData()[0].name).toBe('Alfa');

    fixture.componentInstance.onSort(columns[0]);

    expect(fixture.componentInstance.pagedData()[0].name).toBe('Beta');
  });

  it('should search and clear search', () => {
    fixture.componentInstance.onSearchChange('alfa');

    expect(fixture.componentInstance.filteredData().length).toBe(1);

    fixture.componentInstance.onClearSearch();

    expect(fixture.componentInstance.filteredData().length).toBe(2);
  });

  it('should paginate and change page size', () => {
    fixture.componentInstance.onPageChange({ pageIndex: 0, pageSize: 1 });

    expect(fixture.componentInstance.pagedData().length).toBe(1);
  });

  it('should apply configured filters', () => {
    const filters: readonly TableFilter<TestRow>[] = [
      {
        key: 'status',
        label: 'Estado',
        type: 'status',
        value: 'Activo',
      },
    ];
    fixture.componentRef.setInput('filters', filters);

    expect(fixture.componentInstance.filteredData().length).toBe(1);
  });

  it('should select individual rows', () => {
    const event = new MouseEvent('click');
    fixture.componentRef.setInput('selectable', true);
    fixture.componentInstance.onToggleRow(data[0], event);

    expect(fixture.componentInstance.selectedRows().length).toBe(1);
  });

  it('should select all visible rows', () => {
    fixture.componentRef.setInput('selectable', true);
    const input = document.createElement('input');
    input.checked = true;

    fixture.componentInstance.onToggleAllVisible({ target: input } as unknown as Event);

    expect(fixture.componentInstance.selectedRows().length).toBe(2);
  });

  it('should emit row actions', () => {
    const action: TableAction<TestRow> = {
      id: 'view',
      label: 'Ver',
      icon: 'visibility',
      variant: 'default',
    };
    const spy = vi.spyOn(fixture.componentInstance.actionClick, 'emit');

    fixture.componentInstance.onActionClick({ action, row: data[0] });

    expect(spy).toHaveBeenCalled();
  });

  it('should show loading, empty and error states', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-table-skeleton')).toBeTruthy();

    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin datos');

    fixture.componentRef.setInput('error', 'Error simulado');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Error simulado');
  });

  it('should export csv content', () => {
    const spy = vi.spyOn(fixture.componentInstance.exportTable, 'emit');
    fixture.componentInstance.onExport();

    expect(spy).toHaveBeenCalled();
  });

  it('should persist preferences safely', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    fixture.componentRef.setInput('preferencesKey', 'datatable-test');

    fixture.componentInstance.onPageChange({ pageIndex: 0, pageSize: 50 });

    expect(spy).toHaveBeenCalledWith('datatable-test', expect.stringContaining('"pageSize":50'));
  });
});
