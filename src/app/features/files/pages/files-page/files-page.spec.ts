import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FilesPageComponent } from './files-page';

describe('FilesPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilesPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render smart import entry point', () => {
    const fixture = TestBed.createComponent(FilesPageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Archivos');
    expect(compiled.textContent).toContain('Importación inteligente');
    expect(compiled.textContent).toContain('Suelta aquí tu archivo');
  });
});
