import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DailyReportPageComponent } from './daily-report-page';

describe('DailyReportPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render dashboard page with daily report content', () => {
    const fixture = TestBed.createComponent(DailyReportPageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Estadisticas circulares');
    expect(compiled.textContent).toContain('Estado de guia');
    expect(compiled.textContent).toContain('Resumen general del día');
  });
});
