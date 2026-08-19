import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CampaignsPageComponent } from './campaigns-page';

describe('CampaignsPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignsPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render campaigns page', () => {
    const fixture = TestBed.createComponent(CampaignsPageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Campañas publicitarias');
    expect(compiled.textContent).toContain('Resumen publicitario');
    expect(compiled.textContent).toContain('Rendimiento por campaña');
  });
});
