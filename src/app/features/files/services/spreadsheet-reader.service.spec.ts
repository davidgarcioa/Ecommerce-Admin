import { TestBed } from '@angular/core/testing';
import * as XLSX from 'xlsx';

import { SpreadsheetReaderService } from './spreadsheet-reader.service';

describe('SpreadsheetReaderService', () => {
  let service: SpreadsheetReaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpreadsheetReaderService);
  });

  it('should read csv files', async () => {
    const file = new File(['Orden,Fecha,Cliente\nORD-1,2026-07-29,Ana'], 'ordenes.csv', {
      type: 'text/csv',
    });

    const workbook = await service.readWorkbook(file);

    expect(workbook.sheets.length).toBe(1);
    expect(workbook.sheets[0].rowCount).toBe(2);
  });

  it('should read xlsx files', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([['Orden'], ['ORD-1']]),
      'Datos',
    );
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const file = new File([buffer], 'ordenes.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await service.readWorkbook(file);

    expect(result.sheets[0].name).toBe('Datos');
  });
});
